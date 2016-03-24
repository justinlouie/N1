import Rx from 'rx-lite'
import {CalendarDataSource} from 'nylas-exports'
import ProposedTimeStore from './proposed-time-store'

export default class ProposedTimeCalendarDataSource extends CalendarDataSource {
  buildObservable({startTime, endTime}) {
    const $events = super.buildObservable(startTime, endTime);
    const $proposedTimes = Rx.Observable.fromStore(ProposedTimeStore)
      .map((store) => {return store.timeBlocksAsEvents()})
    const $obs = Rx.Observable.combineLatest([$events, $proposedTimes])
      .map(([calEvents, proposedTimes]) => {
        return {events: calEvents.concat(proposedTimes)}
      })
    return $obs;
  }
}
