import CalendarButton from './calendar-button'
import ProposedTimeEvent from './proposed-time-event'
import ProposedTimeStore from './proposed-time-store'
import ProposedTimePicker from './proposed-time-picker'
import {ComponentRegistry, WorkspaceStore} from 'nylas-exports'

export function activate() {
  if (NylasEnv.getWindowType() === 'calendar') {
    ProposedTimeStore.activate()

    NylasEnv.getCurrentWindow().setMinimumSize(480, 250)
    WorkspaceStore.defineSheet('Main', {root: true},
      {popout: ['Center']})

    ComponentRegistry.register(ProposedTimeEvent,
      {role: 'Calendar:Event:Right'});

    ComponentRegistry.register(ProposedTimePicker,
      {location: WorkspaceStore.Location.Center})
  } else {
    ComponentRegistry.register(CalendarButton,
      {role: 'Composer:ActionButton'});
  }
}

export function serialize() {
}

export function deactivate() {
  ProposedTimeStore.deactivate()

  if (NylasEnv.getWindowType() === 'calendar') {
    ComponentRegistry.unregister(ProposedTimePicker);
  } else {
    ComponentRegistry.unregister(CalendarButton);
  }
}
