/** @babel */

import CalendarButton from './calendar-button'
import ProposedTimeStore from './proposed-time-store'
import TimeProposingCalendar from './time-proposing-calendar'
import {ComponentRegistry, WorkspaceStore} from 'nylas-exports'

export function activate() {
  if (NylasEnv.getWindowType() === 'calendar') {
    this.proposedTimeStore = new ProposedTimeStore()
    this.proposedTimeStore.activate()

    NylasEnv.getCurrentWindow().setMinimumSize(480, 250)
    WorkspaceStore.defineSheet('Main', {root: true},
      {popout: ['Center']})

    ComponentRegistry.register(TimeProposingCalendar,
      {location: WorkspaceStore.Location.Center})
  } else {
    ComponentRegistry.register(CalendarButton,
        {role: 'Composer:ActionButton'});
  }
}

export function serialize() {
}

export function deactivate() {
  this.proposedTimeStore.deactivate()

  if (NylasEnv.getWindowType() === 'calendar') {
    ComponentRegistry.unregister(TimeProposingCalendar);
  } else {
    ComponentRegistry.unregister(CalendarButton);
  }
}
