import {React} from 'nylas-exports'
import {RetinaImg} from 'nylas-component-kit'

export default class CalendarButton extends React.Component {
  static displayName = 'CalendarButton';

  _onClick = () => {
    NylasEnv.newWindow(
      {title: "Calendar",
       windowType: "calendar",
       windowProps: {}}
    )
  }


  _getDialog() {
    require('remote').require('dialog')
  }

  render() {
    return (<button className="btn btn-toolbar" onClick={this._onClick} title="Insert calendar availability…">
      <RetinaImg url="nylas://quick-schedule/assets/icon-composer-quickschedule@2x.png" mode={RetinaImg.Mode.ContentIsMask} />
    </button>)
  }

}
