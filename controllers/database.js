const path = (relPath) => {
  return `${__dirname}/${relPath}`;
};
exports.tourDB = path('../dev-data/data/tours-simple.json');
exports.userDB = path('../dev-data/data/users.json');
