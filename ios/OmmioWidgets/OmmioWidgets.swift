import WidgetKit
import SwiftUI

// MARK: - 1. Veri Modeli (React Native'den gelen JSON yapısı)
struct WidgetTaskData: Codable {
    let text: String
    let completed: Bool
    let date: String?
    let priority: String?
}

// MARK: - 2. Timeline Entry (Zaman çizelgesi girişi)
struct SimpleEntry: TimelineEntry {
    let date: Date
    let task: WidgetTaskData?
}

// MARK: - 3. Provider (Veri Sağlayıcı)
struct Provider: TimelineProvider {
    
    // 🚨 DİKKAT: Burayı kendi App Group ID'n ile güncelle!
    // Örnek: "group.com.enesberkay.ommio" (Xcode ile birebir aynı olmalı)
    let AppGroupID = "group.com.seninadin.ommio.widgets"
    
    // Widget galerisinde görünecek örnek veri
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), task: WidgetTaskData(text: "Örnek Görev", completed: false, date: "Bugün", priority: "high"))
    }

    // Widget anlık görüntüsü (Snapshot)
    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), task: WidgetTaskData(text: "Yükleniyor...", completed: false, date: nil, priority: "medium"))
        completion(entry)
    }

    // Widget'ın güncellenme mantığı (Timeline)
    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
        let currentDate = Date()
        var criticalTask: WidgetTaskData? = nil
        
        // 1. App Group'a bağlan
        if let sharedDefaults = UserDefaults(suiteName: AppGroupID) {
            
            // 2. Veriyi çek (Anahtar kelime React Native ile aynı olmalı: "TaskWidgetSmall_data")
            if let jsonString = sharedDefaults.string(forKey: "TaskWidgetSmall_data") {
                
                // Debug için konsola yazdır (Mac Console uygulamasında görünür)
                print("Widget: JSON verisi bulundu -> \(jsonString)")
                
                if let jsonData = jsonString.data(using: .utf8) {
                    do {
                        // 3. JSON'ı Swift objesine çevir
                        criticalTask = try JSONDecoder().decode(WidgetTaskData.self, from: jsonData)
                    } catch {
                        print("Widget: JSON Çevirme Hatası: \(error)")
                    }
                }
            }
        }
        
        // Entry oluştur
        let entry = SimpleEntry(date: currentDate, task: criticalTask)
        
        // Widget'ı güncelleme politikası (.atEnd veya belirli bir süre sonra)
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        
        completion(timeline)
    }
}

// MARK: - 4. Widget Görünümü (Tasarım)
struct OmmioWidgetsEntryView : View {
    var entry: Provider.Entry
    
    // Renkleri önceliğe göre belirle
    func getPriorityColor(_ priority: String?) -> Color {
        switch priority {
        case "high": return .red
        case "low": return .green
        default: return .orange // medium
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            
            // Başlık (Logo veya App İsmi)
            HStack {
                Text("Ommio")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.gray)
                Spacer()
                // Tarih varsa göster
                if let date = entry.task?.date {
                    Text(date)
                        .font(.system(size: 10))
                        .foregroundColor(.gray)
                }
            }
            
            Spacer()
            
            if let task = entry.task {
                // --- GÖREV VARSA ---
                HStack(alignment: .top) {
                    // Öncelik Çizgisi
                    Rectangle()
                        .fill(getPriorityColor(task.priority))
                        .frame(width: 4)
                        .cornerRadius(2)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text(task.text)
                            .font(.system(size: 14, weight: .semibold))
                            .lineLimit(3) // En fazla 3 satır
                            .multilineTextAlignment(.leading)
                        
                        if task.completed {
                            Text("Tamamlandı")
                                .font(.caption2)
                                .foregroundColor(.green)
                        }
                    }
                }
            } else {
                // --- GÖREV YOKSA ---
                VStack(alignment: .center) {
                    Text("Görev Yok")
                        .font(.headline)
                        .foregroundColor(.primary)
                    Text("Yeni bir görev ekle")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                .frame(maxWidth: .infinity) // Ortala
            }
            
            Spacer()
        }
    }
}

// MARK: - 5. Widget Konfigürasyonu
struct OmmioWidgets: Widget {
    let kind: String = "OmmioWidgets"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                OmmioWidgetsEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                OmmioWidgetsEntryView(entry: entry)
                    .padding()
                    .background(Color.white)
            }
        }
        .configurationDisplayName("Ommio Görevler")
        .description("Son eklenen veya öncelikli görevini gör.")
        .supportedFamilies([.systemSmall, .systemMedium]) // Desteklenen boyutlar
    }
}
