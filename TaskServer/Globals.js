exports.newGlobals = function newGlobals() {

    let thisObject = {
        initialize: initialize
    }

    return thisObject;

    function initialize() {

        /* This is the Execution Datetime */

        global.EXECUTION_DATETIME = new Date();
        global.ROOT_DIR = './';

        global.LOGGER_MAP = new Map()   // We will put all the loggers in a map, so that we can eventually finalize them.
        global.SESSION_MAP = new Map()  // We will put all the sessions in a map, so that we can eventually finalize them.

        global.UNIQUE_ID = function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
                return v.toString(16)
            })
        }

        global.PRECISE = function (floatNumber, precision) {
            return this.parseFloat(floatNumber.toFixed(precision))
        }

        global.REMOVE_TIME = function (datetime) {
            const GMT_SECONDS = ':00.000 GMT+0000';
            let date = new Date(datetime)
            return new Date(date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate() + " " + "00:00" + GMT_SECONDS);
        }

        global.FINALIZE_LOGGERS = function () {
            global.LOGGER_MAP.forEach(forEachLogger)

            function forEachLogger(logger) {
                if (logger !== undefined) {
                    logger.finalize()
                }
            }
        }

        global.SHUTTING_DOWN_PROCESS = false

        global.EXIT_NODE_PROCESS = function exitProcess() {

            if (global.unexpectedError !== undefined) {
                TS.projects.superalgos.functionLibraries.taskFunctions.taskError(undefined, "An unexpected error caused the Task to stop.")
            }

            if (global.SHUTTING_DOWN_PROCESS === true) { return }
            global.SHUTTING_DOWN_PROCESS = true

            /* Signal that all sessions are stopping. */
            TS.projects.superalgos.functionLibraries.sessionFunctions.finalizeSessions()

            /* Cleaning Before Exiting. */
            clearInterval(global.HEARTBEAT_INTERVAL_HANDLER)

            if (global.TASK_NODE !== undefined) {
                for (let i = 0; i < global.TASK_NODE.bot.processes.length; i++) {
                    let config = global.TASK_NODE.bot.processes[i].config
                    let process = global.TASK_NODE.bot.processes[i]

                    let key = process.name + '-' + process.type + '-' + process.id
                    global.EVENT_SERVER_CLIENT_MODULE.raiseEvent(key, 'Stopped') // Meaning Process Stopped
                }
            }

            global.FINALIZE_LOGGERS()
            //console.log("[INFO] Task Server -> " + global.TASK_NODE.name + " -> EXIT_NODE_PROCESS -> Task Server will stop in 10 seconds.");

            setTimeout(process.exit, 10000) // We will give 10 seconds to logs be written on file
        }

        require('dotenv').config();

        global.WRITE_LOGS_TO_FILES = process.env.WRITE_LOGS_TO_FILES

        /*
        We need to count how many process instances we deployd and how many of them have already finished their job, either
        because they just finished or because there was a request to stop the proceses. In this way, once we reach the
        amount of instances started, we can safelly destroy the rest of the objects running and let this nodejs process die.
        */

        global.ENDED_PROCESSES_COUNTER = 0
        global.TOTAL_PROCESS_INSTANCES_CREATED = 0

        global.STOP_TASK_GRACEFULLY = false;

        global.GET_PERCENTAGE = function (fromDate, currentDate, lastDate) {
            let fromDays = Math.trunc(fromDate.valueOf() / TS.projects.superalgos.globals.timeConstants.ONE_DAY_IN_MILISECONDS)
            let currentDays = Math.trunc(currentDate.valueOf() / TS.projects.superalgos.globals.timeConstants.ONE_DAY_IN_MILISECONDS)
            let lastDays = Math.trunc(lastDate.valueOf() / TS.projects.superalgos.globals.timeConstants.ONE_DAY_IN_MILISECONDS)
            let percentage = (currentDays - fromDays) * 100 / (lastDays - fromDays)
            if ((lastDays - fromDays) === 0) {
                percentage = 100
            }
            return percentage
        }

        global.GET_EQUAL_DATES = function (date1, date2) {
            let day1Days = Math.trunc(date1.valueOf() / TS.projects.superalgos.globals.timeConstants.ONE_DAY_IN_MILISECONDS)
            let day2Days = Math.trunc(date2.valueOf() / TS.projects.superalgos.globals.timeConstants.ONE_DAY_IN_MILISECONDS)

            if (day1Days === day2Days) {
                return true
            } else {
                return false
            }
        }
    }
}