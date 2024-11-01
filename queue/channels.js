const {process} = require('./syncCalendar');

// queue channels
module.exports = [{
    name:'calenderEvents',
    process: process
}];
