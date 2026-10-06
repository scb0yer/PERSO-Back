const mongoose = require('mongoose');
const Student = require('../models/Student');
const Attempt = require('../models/Attempt');
const Exercice = require('../models/Exercice');
const Classe = require('../models/Class');
const { parisDay, awardedTenths, DAY_CAP } = require('./points-rules');
const fail = (status, message) => Object.assign(new Error(message), { status });

// Aucun appel réseau ni effet externe dans la transaction : MongoDB peut la rejouer.
module.exports = async function recordAttempt(studentId, input) {
  const { submissionId, score, maxScore } = input;
  const exerciceId = new mongoose.Types.ObjectId(input.exerciceId);
  const receivedAt = new Date();
  const rewardDay = parisDay(receivedAt);
  return mongoose.connection.transaction(async session => {
    // Une vraie modification du document sérialise les crédits d'un même élève.
    // En cas de conflit, withTransaction recommence avec une nouvelle vue des données.
    const student = await Student.findOneAndUpdate(
      { _id: studentId }, { $inc: { pointsRevision: 1 } }, { new: true, session }
    );
    if (!student) throw fail(401, 'Compte introuvable.');
    const previous = await Attempt.findOne({ studentId, submissionId }).session(session);
    if (previous) {
      if (previous.exerciceId.toString() !== exerciceId.toString() || previous.score !== score || previous.maxScore !== maxScore)
        throw fail(409, 'submissionId déjà utilisé avec un autre contenu.');
      // Un ancien envoi, même renvoyé le lendemain, ne rapporte rien de plus.
      return { attempt: previous.toObject(), replayed: true, reward: {
        creditedTenths: 0,
        attemptAwardedTenths: previous.pointsAwardedTenths || 0,
        day: previous.rewardDay || null,
        exerciseDayTenths: previous.exerciseDayTenthsAfter ?? null,
        remainingTenths: previous.rewardDay ? Math.max(0, DAY_CAP - (previous.exerciseDayTenthsAfter || 0)) : null,
        totalTenths: student.pointsTenths || 0,
      } };
    }
    awardedTenths(score, maxScore, 0); // Validation avant toute écriture définitive.
    if (!await Exercice.exists({ _id: exerciceId }).session(session)) throw fail(404, 'Exercice introuvable.');
    if (!await Classe.exists({ _id: student.classe }).session(session)) throw fail(409, 'Classe introuvable.');
    const totals = await Attempt.aggregate([
      { $match: { studentId: student._id, exerciceId, rewardDay } },
      { $group: { _id: null, total: { $sum: '$pointsAwardedTenths' } } },
    ]).session(session);
    const alreadyEarned = totals[0]?.total || 0;
    const gain = awardedTenths(score, maxScore, alreadyEarned);
    const dayTotal = alreadyEarned + gain;
    const [attempt] = await Attempt.create([{
      studentId: student._id, classId: student.classe, exerciceId, submissionId,
      score, maxScore, scoreVerified: false, date: receivedAt,
      rewardDay, pointsAwardedTenths: gain, exerciseDayTenthsAfter: dayTotal,
      pointsRuleVersion: 1,
    }], { session });
    await Student.updateOne({ _id: student._id }, { $inc: { pointsTenths: gain } }, { session });
    return { attempt: attempt.toObject(), replayed: false, reward: {
      creditedTenths: gain, attemptAwardedTenths: gain, day: rewardDay,
      exerciseDayTenths: dayTotal, remainingTenths: Math.max(0, DAY_CAP - dayTotal),
      totalTenths: (student.pointsTenths || 0) + gain,
    } };
  }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary' });
};
