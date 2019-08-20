module.exports = function({ client }) {
  return ({
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    _context: {
      client: {
        config: {
          client
        }
      }
    },
    transaction: jest.fn(function (callback) {
      const trx = {
        commit: jest.fn(() => {}),
        rollback: jest.fn(() => {}),
      }
      return callback(trx);
    })
  })
}