const { createLogger, format, transports } = require('winston');

module.exports = () => {
  // Configure the Winston logger. For the complete documentation
  // see https://github.com/winstonjs/winston
  return createLogger({
    // To see more detailed errors, change this to 'debug'
    level: 'info',
    format: format.combine(
      format.splat(),
      format.simple(),
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: 'logger/error.log', level: 'error' }),
      //new transports.File({ filename: 'logger/common.log' }),
    ],
  });
}

module.exports.sname = "logger";