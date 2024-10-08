const { St, Clutter, Gio, GLib, GObject } = imports.gi
const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu
const ExtensionUtils = imports.misc.extensionUtils
const Me = ExtensionUtils.getCurrentExtension()

const TimerIndicator = GObject.registerClass(
  class TimerIndicator extends PanelMenu.Button {
    _init() {
      super._init(0.0, _('Timer Indicator'))

      this._settings = ExtensionUtils.getSettings(
        'org.gnome.shell.extensions.x-min-beep@drupov'
      )
      this._interval = this._settings.get_int('interval')
      this._remainingTime = this._interval
      this._totalMinutes = 0
      this._clickCount = 0

      this.label = new St.Label({
        text: this.printLabel(this._remainingTime),
        y_align: Clutter.ActorAlign.CENTER,
        style_class: 'timer-indicator-label',
      })
      this.add_child(this.label)

      this._timeout = null
      this._countdownTimeout = null

      this._playBeep = () => {
        let [success, argv] = GLib.shell_parse_argv(
          'aplay ' + Me.path + '/assets/beep.wav'
        )
        if (success) {
          GLib.spawn_async(null, argv, null, GLib.SpawnFlags.SEARCH_PATH, null)
        }
      }

      this._updateLabel = () => {
        this.label.text = this._timeout
          ? this.printLabel(this._remainingTime, this._totalMinutes)
          : this.printLabel(this._interval)
      }

      this._startCountdown = () => {
        if (this._countdownTimeout) {
          GLib.source_remove(this._countdownTimeout)
        }
        this._remainingTime = this._interval
        this._totalMinutes = 0
        this._updateLabel()
        this._countdownTimeout = GLib.timeout_add_seconds(
          GLib.PRIORITY_DEFAULT,
          60,
          () => {
            this._remainingTime--
            this._totalMinutes++
            if (this._remainingTime <= 0) {
              this._playBeep()
              this._remainingTime = this._interval
            }
            this._updateLabel()
            return true
          }
        )
      }

      this.connect('button-press-event', () => {
        this._clickCount++

        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
          if (this._clickCount === 1) {
            if (!this._timeout) {
              this._startCountdown()
              this._timeout = GLib.timeout_add_seconds(
                GLib.PRIORITY_DEFAULT,
                this._interval * 60,
                () => {
                  this._playBeep()
                  return true
                }
              )
              this.label.add_style_class_name('active')
              this._updateLabel()
            }
          } else if (this._clickCount === 2) {
            if (this._timeout) {
              GLib.source_remove(this._timeout)
              GLib.source_remove(this._countdownTimeout)
              this._timeout = null
              this._countdownTimeout = null
              this._remainingTime = this._interval
              this._totalMinutes = 0
              this._updateLabel()
              this.label.remove_style_class_name('active')
            }
          }
          this._clickCount = 0
          return GLib.SOURCE_REMOVE
        })

        return Clutter.EVENT_STOP
      })

      this._settings.connect('changed::interval', () => {
        this._interval = this._settings.get_int('interval')
        this._remainingTime = this._interval
        this._updateLabel()
      })
    }

    printLabel(remainingMinutes, totalMinutes = null) {
      return totalMinutes !== null
        ? `Beep in ${remainingMinutes} min (${totalMinutes})`
        : `Beep in ${remainingMinutes} min`
    }

    destroy() {
      if (this._timeout) {
        GLib.source_remove(this._timeout)
        GLib.source_remove(this._countdownTimeout)
        this._timeout = null
        this._countdownTimeout = null
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
