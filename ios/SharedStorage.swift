import Foundation
import WidgetKit

@objc(SharedStorage)
class SharedStorage: NSObject {

    // Kendi App Group ID'ni buraya yaz
    let appGroupID = "group.com.seninadin.ommio.widgets"

    @objc(set:value:)
    func set(key: String, value: String) {
        guard let sharedDefaults = UserDefaults(suiteName: appGroupID) else {
            print("Hata: App Group bulunamadı.")
            return
        }
        sharedDefaults.set(value, forKey: key)
        
        // Veriyi kaydettikten sonra Widget'ı yenile
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
}
