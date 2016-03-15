/** @babel */

import CalendarButton from './calendar-button'
import {ComponentRegistry, WorkspaceStore} from 'nylas-exports'
import {Calendar} from 'nylas-component-kit'

export function activate() {
  if (NylasEnv.getWindowType() === 'calendar') {
    NylasEnv.getCurrentWindow().setMinimumSize(480, 250)
    WorkspaceStore.defineSheet('Main', {root: true},
      {popout: ['Center']})

    ComponentRegistry.register(Calendar,
      {location: WorkspaceStore.Location.Center})
  }
  else {
    ComponentRegistry.register(CalendarButton,
        {role: 'Composer:ActionButton'});
  }
}

export function serialize() {
}

export function deactivate() {
  if (NylasEnv.getWindowType() === 'calendar') {
    console.log("it works!");
  }
  else {
    ComponentRegistry.unregister(CalendarButton);
  }
}
