const { GObject, Gtk, Gio } = imports.gi
const ExtensionUtils = imports.misc.extensionUtils

function init() {}

function buildPrefsWidget() {
  let settings = ExtensionUtils.getSettings(
    'org.gnome.shell.extensions.x-min-beep@drupov'
  )

  let widget = new Gtk.Grid({
    column_homogeneous: true,
    row_spacing: 10,
    column_spacing: 10,
    margin_start: 20,
    margin_end: 20,
    margin_top: 20,
    margin_bottom: 20,
  })

  let label = new Gtk.Label({
    label: 'Beep interval (minutes)',
    hexpand: true,
    halign: Gtk.Align.START,
  })
  widget.attach(label, 0, 0, 1, 1)

  let adjustment = new Gtk.Adjustment({
    lower: 1,
    upper: 60,
    step_increment: 1,
  })
  let spinButton = new Gtk.SpinButton({
    adjustment: adjustment,
  })
  spinButton.set_value(settings.get_int('interval'))
  widget.attach(spinButton, 1, 0, 1, 1)

  spinButton.connect('value-changed', (button) => {
    settings.set_int('interval', button.get_value_as_int())
  })

  widget.show()
  return widget
}
