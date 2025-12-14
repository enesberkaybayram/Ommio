import WidgetKit
import SwiftUI
import Foundation


// Objective-C ve dolayısıyla React Native tarafından erişilebilen köprü sınıfı
@objc(WidgetBridge)
class WidgetBridge: NSObject {
    
    // RN'den çağrılacak metot
    @objc public static func reloadAllTimelines() {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
            print("DEBUG: 🚀 Köprüleme Başarılı. WidgetCenter.shared.reloadAllTimelines() çağrıldı.")
        } else {
            print("DEBUG: HATA - WidgetCenter, iOS 14.0 ve sonrası için desteklenir.")
        }
    }
}

// MARK: - 1. JSON Veri Yapıları (React Native'den Gelen)

// React Native'deki WidgetTask tipine karşılık gelir. Decodable olmalıdır.
struct WidgetTaskData: Codable, Hashable {
    let text: String
    let completed: Bool
    let date: String?
    let priority: String?
}

// MARK: - 2. Timeline Entry Yapısı

// Widget zaman çizelgesindeki tek bir giriş noktasını temsil eder.
struct SimpleEntry: TimelineEntry {
    let date: Date
    let task: WidgetTaskData? // Opsiyonel Task verisini tutar
}

// MARK: - 3. Veri Sağlayıcı (Provider)

struct Provider: TimelineProvider {
    
    // 🚨 Kendi App Group ID'nizle DEĞİŞTİRİN
    let AppGroupID = "group.com.seninadin.ommio.widgets"
    
    // Placeholder (Widget galerisinde gösterilen varsayılan içerik)
    func placeholder(in context: Context) -> SimpleEntry {
        return SimpleEntry(date: Date(), task: WidgetTaskData(text: "Yeni Görev", completed: false, date: nil, priority: nil))
    }

    // getSnapshot (Anlık gösterim için)
    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), task: nil)
        completion(entry)
    }

    // getTimeline (Periyodik veriyi ve güncelleme politikasını sağlar)
  func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
      
      let currentDate = Date()
      var criticalTask: WidgetTaskData? = nil
      
      // Veri okuma işlemini başlat
      guard let sharedDefaults = UserDefaults(suiteName: AppGroupID) else {
          print("DEBUG: 🚨 HATA - App Group ID: \(AppGroupID) bulunamadı veya erişilemiyor!")
          // ... (Hata kodu) ...
          return
      }
      
      // AsyncStorage'dan veriyi çekme (TaskWidgetSmall_data anahtarını kullanır)
      if let jsonString = sharedDefaults.string(forKey: "TaskWidgetSmall_data") {
          
          // 1. Gelen Veriyi Logla (Kritik Kontrol)
          print("DEBUG: RN'den Gelen Ham JSON: \(jsonString.prefix(200))")
          
          // Swift, 'null' dizesini çözümlerken hata verir, bu yüzden kontrol ekleyelim.
          if jsonString == "null" {
              print("DEBUG: Ham JSON 'null' olduğu için görev yok.")
          } else if let jsonData = jsonString.data(using: String.Encoding.utf8) {
              do {
                  criticalTask = try JSONDecoder().decode(WidgetTaskData.self, from: jsonData)
                  print("DEBUG: ✅ JSON ÇÖZÜMLEME BAŞARILI. Görev: \(criticalTask?.text ?? "Bilinmiyor")")
              } catch {
                  // 2. Çözülme Hatalarını Logla
                  print("DEBUG: ❌ JSON ÇÖZÜMLEME HATA: \(error.localizedDescription)")
              }
          }
      } else {
          print("DEBUG: ⚠️ TaskWidgetSmall_data anahtarı boş veya bulunamadı.")
      }
        
        // Entry Oluşturma
        let entry: SimpleEntry = SimpleEntry(date: currentDate, task: criticalTask)
        
        // Timeline'ı yayımla (5 dakikada bir yenileme denemesi)
        let timeline = Timeline(entries: [entry], policy: .after(currentDate.addingTimeInterval(60 * 5)))
        completion(timeline)
      print("AppGroupID:", AppGroupID)
      print("sharedDefaults nil mi:", UserDefaults(suiteName: AppGroupID) == nil)
      print("json:", UserDefaults(suiteName: AppGroupID)?.string(forKey: "TaskWidgetSmall_data") ?? "NIL")
    }
}

// MARK: - 4. Widget Görünümü (View)

// Bu, Widget Extension'ın içeriğini gösteren SwiftUI View'dir.
struct OmmioWidgetsEntryView : View {
    @Environment(\.widgetFamily) var family // Widget boyutunu almak için
    var entry: Provider.Entry

    var body: some View {
        
        // Anahtar kontrol: entry.task varsa içeriği göster
        if let taskData = entry.task {
            VStack(alignment: .leading, spacing: 5) {
                Text(taskData.priority ?? "GÖREV").font(.system(size: 10, weight: .bold))
                    .foregroundColor(taskData.priority == "high" ? Color.red : Color.blue)
                
                Text(taskData.text)
                    .font(.system(size: 14, weight: .semibold))
                    .lineLimit(family == .systemSmall ? 3 : 5) // Boyuta göre satır sınırı
                
                Spacer()
                
                HStack {
                    Image(systemName: taskData.completed ? "checkmark.circle.fill" : "circle")
                        .foregroundColor(taskData.completed ? Color.green : Color.gray)
                    Text(taskData.date ?? "Bugün").font(.caption)
                }
            }
            .padding()
            // iOS 17+ Zorunluluğu: containerBackground hatası çözüldü
            .containerBackground(for: .widget) {
                Color.clear
            }
        } else {
            // Veri yoksa veya hata varsa Placeholder göster
            VStack {
                Image(systemName: "checklist")
                Text("Ommio").font(.headline)
                Text("Görev Yok").font(.caption)
            }
            .padding()
            // iOS 17+ Zorunluluğu: containerBackground hatası çözüldü
            .containerBackground(for: .widget) {
                Color.clear
            }
        }
    }
}

// MARK: - 5. Widget Tanımlaması (WidgetBundle İçin Yapı)

struct OmmioWidgets: Widget {
    let kind: String = "OmmioWidgets"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            OmmioWidgetsEntryView(entry: entry) // Provider'ın entry tipini kullanır
        }
        // Small, Medium ve Large boyutlarını destekler
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
        .configurationDisplayName("Ommio Görevler")
        .description("Öncelikli görevlerinizi ana ekranınızda görün.")
    }
}
