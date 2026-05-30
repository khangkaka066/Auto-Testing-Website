// In-memory user store.
// Shape: { [email]: { id, name, email, password_hash, avatar } }
const usersDb = {};

function findByEmail(email) {
  return usersDb[email] || null;
}

function findById(id) {
  return Object.values(usersDb).find(u => u.id === id) || null;
}

function save(email, user) {
  usersDb[email] = user;
}

module.exports = { usersDb, findByEmail, findById, save };
