/** @babel */
import Reflux from 'reflux';

const ScheduleActions = Reflux.createActions([
  'paintTime',
  'removeProposal',
])

for (const key in ScheduleActions) {
  if ({}.hasOwnProperty.call(ScheduleActions, key)) {
    ScheduleActions[key].sync = true
  }
}

export default ScheduleActions
