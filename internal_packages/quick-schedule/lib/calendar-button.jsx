import {React} from 'nylas-exports'
import {RetinaImg} from 'nylas-component-kit'

export default class CalendarButton extends React.Component {
  static displayName = 'CalendarButton';

  static propTypes = {
    draftClientId: React.PropTypes.string.isRequired,
  }

  _onClick = () => {
    NylasEnv.newWindow({
      title: "Calendar",
      windowType: "calendar",
      windowProps: {
        draftClientId: this.props.draftClientId,
      },
    });
  }

  render() {
    return (
      <button className="btn btn-toolbar"
        onClick={this._onClick} title="Insert calendar availability…"
      >
        <RetinaImg url="nylas://quick-schedule/assets/icon-composer-quickschedule@2x.png" mode={RetinaImg.Mode.ContentIsMask} />
      </button>
    )
  }

}
