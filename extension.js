const { St, Clutter, Gio, GLib, GObject } = imports.gi
const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()
const GioSSS = Gio.SettingsSchemaSource

const TimerIndicator = GObject.registerClass(
  class TimerIndicator extends PanelMenu.Button {
    _init() {
      super._init(0.0, _('Timer Indicator'))

      this._settings = ExtensionUtils.getSettings(
        'org.gnome.shell.extensions.x-min-beep@drupov'
      )
      this._interval = this._settings.get_int('interval')

      this.label = new St.Label({
        text: `${this._interval} min beep`,
        y_align: Clutter.ActorAlign.CENTER,
      })
      this.add_child(this.label)

      this._timeout = null

      this._playBeep = () => {
        let [success, argv] = GLib.shell_parse_argv(
          'aplay ' + Me.path + '/assets/beep.wav'
        )
        if (success) {
          GLib.spawn_async(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null)
        }
      }

      this.connect('button-press-event', () => {
        if (this._timeout) {
          GLib.source_remove(this._timeout)
          this._timeout = null
          this.label.remove_style_class_name('active')
        } else {
          this._timeout = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            this._interval * 60,
            () => {
              this._playBeep()
              return true
            }
          )
          this.label.add_style_class_name('active')
        }
      })

      this._settings.connect('changed::interval', () => {
        this._interval = this._settings.get_int('interval')
        this.label.text = `${this._interval} min beep`
      })
    }

    destroy() {
      if (this._timeout) {
        GLib.source_remove(this._timeout)
        this._timeout = null
      }
      super.destroy()
    }
  }
)

class Extension {
  constructor() {
    this._indicator = null
  }

  enable() {
    this._indicator = new TimerIndicator()
    Main.panel.addToStatusArea('timer-indicator', this._indicator)
  }

  disable() {
    if (this._indicator !== null) {
      this._indicator.destroy()
      this._indicator = null
    }
  }
}

function init() {
  return new Extension()
}
