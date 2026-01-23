import Adw from 'gi://Adw'
import Gtk from 'gi://Gtk'

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

export default class XMinBeepPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings()

    const page = new Adw.PreferencesPage()
    const group = new Adw.PreferencesGroup()

    const adjustment = new Gtk.Adjustment({
      lower: 1,
      upper: 60,
      step_increment: 1,
    })

    const spinButton = new Gtk.SpinButton({
      adjustment,
      valign: Gtk.Align.CENTER,
    })
    spinButton.set_value(settings.get_int('interval'))
    spinButton.connect('value-changed', (button) => {
      settings.set_int('interval', button.get_value_as_int())
    })

    const row = new Adw.ActionRow({
      title: 'Beep interval (minutes)',
    })
    row.add_suffix(spinButton)
    row.activatable_widget = spinButton

    group.add(row)
    page.add(group)
    window.add(page)
  }
}
