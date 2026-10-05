function validAttempt(body) {
  return Boolean(
    body &&
    typeof body.exerciceId === "string" &&
    /^[a-f0-9]{24}$/i.test(body.exerciceId) &&
    typeof body.submissionId === "string" &&
    /^[a-zA-Z0-9_-]{8,100}$/.test(body.submissionId) &&
    Number.isFinite(body.score) &&
    Number.isFinite(body.maxScore) &&
    body.maxScore >= 1 &&
    body.score >= 0 &&
    body.score <= body.maxScore,
  );
}

function percent(count, target) {
  return target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0;
}

module.exports = { validAttempt, percent };
