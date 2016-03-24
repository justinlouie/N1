import React, {Component, PropTypes} from 'react';
import NewEventCard from './new-event-card'
import {DraftStore} from 'nylas-exports';

export default class NewEventCardContainer extends Component {
  static displayName = 'NewEventCardContainer';

  static propTypes = {
    draftClientId: PropTypes.string,
    threadId: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {events: []};
    this._session = null;
    this._mounted = false;
    this._unsubscribes = [];
  }

  componentDidMount() {
    this._mounted = true;
    this._loadDraft(this.props.draftClientId);

    // TODO FIXME: We need to manually block the keydown event before it
    // hits the React event system. This is because the DAMN FOCUS
    // handlers of the composer will catch the tab and mnaully set the
    // focus elsewhere instead of letting us naturally tab through our
    // form fields.
    React.findDOMNode(this).addEventListener("keydown", this._interceptTab);
  }

  componentWillReceiveProps(newProps) {
    this._loadDraft(newProps.draftClientId);
  }

  componentWillUnmount() {
    this._mounted = false;
    this._unsubscribes.forEach(s => s());
    React.findDOMNode(this).removeEventListener("keydown", this._interceptTab);
  }

  _interceptTab(e) {
    e.stopPropagation()
  }

  _loadDraft(draftClientId) {
    DraftStore.sessionForClientId(draftClientId).then(session => {
      // Only run if things are still relevant: component is mounted
      // and draftClientIds still match
      if (this._mounted) {
        this._session = session;
        this._unsubscribes.forEach(s => s());
        const unsub = session.listen(this._onDraftChange);
        this._unsubscribes.push(unsub);
        this._onDraftChange();
      }
    });
  }

  _onDraftChange = () => {
    const draft = this._session.draft();
    const to = draft.to || [];
    const from = draft.from || [];
    const participants = to.concat(from);
    for (const event of draft.events) {
      event.participants = participants;
    }
    this.setState({events: [].concat(draft.events || [])});
  }

  _onEventChange(change, index) {
    const events = this.state.events;
    const event = events[index].clone();
    Object.assign({}, event, change);
    events.splice(index, 1, event);
    this._session.changes.add({events});  // triggers draft change
  }

  _onEventRemove(index) {
    const events = this.state.events;
    events.splice(index, 1);
    this._session.changes.add({events});  // triggers draft change
  }

  _renderNewEventCard = (event, index) => {
    return (
      <NewEventCard event={event}
        draft={this._session.draft()}
        onRemove={() => this._onEventRemove(index)}
        onChange={(change) => this._onEventChange(change, index)}
        onParticipantsClick={() => {}}
      />
    );
  }

  render() {
    return (
      <div className="new-event-card-container">
        {this.state.events.map(this._renderNewEventCard)}
      </div>
    )
  }
}

