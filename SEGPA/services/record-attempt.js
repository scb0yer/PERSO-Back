const mongoose = require('mongoose');
const Student = require('../models/Student');
const Attempt = require('../models/Attempt');
const Exercice = require('../models/Exercice');
const Classe = require('../models/Class');
const { parisDay, awardedTenths, DAY_CAP } = require('./points-rules');
const weekly = require('./weekly-results');
const { currentWeek } = require('./week-rules');
const fail = (status, message) => Object.assign(new Error(message), { status });

// Aucun appel réseau ni effet externe dans la transaction : MongoDB peut la rejouer.
module.exports = async function recordAttempt(studentId, input) {
  const { submissionId, score, maxScore } = input;
  const exerciceId = new mongoose.Types.ObjectId(input.exerciceId);
  const receivedAt = new Date();
  const rewardDay = parisDay(receivedAt);
  return mongoose.connection.transaction(async session => {
    const seed = await Student.findById(studentId).session(session);
    if (!seed) throw fail(401, 'Compte introuvable.');
    const classe = await weekly.lockClass(seed.classe, session);
    const student = await weekly.lockStudent(studentId, session);
    const previous = await Attempt.findOne({ studentId, submissionId }).session(session);
    if (previous) {
      if (previous.exerciceId.toString() !== exerciceId.toString() || previous.score !== score || previous.maxScore !== maxScore)
        throw fail(409, 'submissionId déjà utilisé avec un autre contenu.');
      // Un ancien envoi, même renvoyé le lendemain, ne rapporte rien de plus.
      return { attempt: previous.toObject(), replayed: true, reward: {
        creditedTenths: 0,
        weeklyContribution: previous.weeklyContribution || null,
        attemptAwardedTenths: previous.pointsAwardedTenths || 0,
        day: previous.rewardDay || null,
        exerciseDayTenths: previous.exerciseDayTenthsAfter ?? null,
        remainingTenths: previous.rewardDay ? Math.max(0, DAY_CAP - (previous.exerciseDayTenthsAfter || 0)) : null,
        totalTenths: student.pointsTenths || 0,
      } };
    }
    const exercise = await Exercice.findById(exerciceId).select('rewardPolicy').session(session);
    if (!exercise) throw fail(404, 'Exercice introuvable.');
    const rewardPolicy = exercise.rewardPolicy || 'standard5';
    awardedTenths(score, maxScore, 0, rewardPolicy); // Validation avant toute écriture définitive.
    if (!await Classe.exists({ _id: student.classe }).session(session)) throw fail(409, 'Classe introuvable.');
    const totals = await Attempt.aggregate([
      { $match: { studentId: student._id, exerciceId, rewardDay } },
      { $group: { _id: null, total: { $sum: '$pointsAwardedTenths' } } },
    ]).session(session);
    const alreadyEarned = totals[0]?.total || 0;
    const classBefore = await weekly.refreshClass(classe, session, receivedAt);
    const studentBefore = await weekly.refreshStudent(student, session, receivedAt, classBefore);
    const week = currentWeek(receivedAt);
    const gain = awardedTenths(score, maxScore, alreadyEarned, rewardPolicy);
    const dayTotal = alreadyEarned + gain;
    const [attempt] = await Attempt.create([{
      studentId: student._id, classId: student.classe, exerciceId, submissionId,
      score, maxScore, scoreVerified: false, date: receivedAt,
      rewardDay, pointsAwardedTenths: gain, exerciseDayTenthsAfter: dayTotal,
      pointsRuleVersion: 1,
    }], { session });
    await Student.updateOne({ _id: student._id }, { $inc: { pointsTenths: gain } }, { session });
    const classAfter = await weekly.refreshClass(classe, session, receivedAt);
    const studentAfter = await weekly.refreshStudent(student, session, receivedAt, classBefore);
    const contribution = {
      week, creditedTenths: gain,
      classBefore: classBefore.weeklyResults[week], classAfter: classAfter.weeklyResults[week],
      studentBefore: studentBefore.weeklyResults[week], studentAfter: studentAfter.weeklyResults[week],
    };
    await Attempt.updateOne({ _id: attempt._id }, { $set: { weeklyContribution: contribution } }, { session });
    return { attempt: { ...attempt.toObject(), weeklyContribution: contribution }, replayed: false, reward: {
      weeklyContribution: contribution,
      creditedTenths: gain, attemptAwardedTenths: gain, day: rewardDay,
      exerciseDayTenths: dayTotal, remainingTenths: Math.max(0, DAY_CAP - dayTotal),
      totalTenths: (student.pointsTenths || 0) + gain,
    } };
  }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary' });
};
