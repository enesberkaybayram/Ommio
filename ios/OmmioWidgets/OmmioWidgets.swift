import WidgetKit
import SwiftUI

// MARK: - 1. Veri Modelleri
struct SharedData: Codable {
    let tasks: [ItemData]
    let habits: [ItemData]?
}

struct ItemData: Codable, Hashable, Identifiable {
    var id: String { title }
    let title: String
    let isCompleted: Bool
}

// MARK: - 2. Timeline Entry
struct SimpleEntry: TimelineEntry {
    let date: Date
    let tasks: [ItemData]
    let habits: [ItemData]
}

// MARK: - 3. Provider
struct Provider: TimelineProvider {
    let AppGroupID = "group.com.seninadin.ommio.widget" // 🚨 Kendi ID'niz
    
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), tasks: [ItemData(title: "Örnek", isCompleted: false)], habits: [])
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        completion(SimpleEntry(date: Date(), tasks: [], habits: []))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SimpleEntry>) -> ()) {
        let currentDate = Date()
        var tasks: [ItemData] = []
        var habits: [ItemData] = []
        
        if let userDefaults = UserDefaults(suiteName: AppGroupID) {
            if let jsonString = userDefaults.string(forKey: "widgetData") {
                if let jsonData = jsonString.data(using: .utf8) {
                    do {
                        let decodedData = try JSONDecoder().decode(SharedData.self, from: jsonData)
                        tasks = decodedData.tasks
                        habits = decodedData.habits ?? []
                    } catch {
                        print("JSON Error: \(error)")
                    }
                }
            }
        }
        
        let entry = SimpleEntry(date: currentDate, tasks: tasks, habits: habits)
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
}

// MARK: - 4. KİLİT EKRANI TASARIMLARI (YENİ)

// A. Kilit Ekranı GÖREVLER
struct TasksLockScreenView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        let total = entry.tasks.count
        let completed = entry.tasks.filter { $0.isCompleted }.count
        let remaining = total - completed
        let progress = total > 0 ? Double(completed) / Double(total) : 0
        
        switch family {
        case .accessoryCircular:
            // Yuvarlak Grafik
            Gauge(value: progress) {
                Text("\(remaining)")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
            }
            .gaugeStyle(.accessoryCircularCapacity)
            
        case .accessoryRectangular:
            // Dikdörtgen Özet
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Image(systemName: "checklist")
                    Text("GÖREVLER")
                        .font(.system(size: 12, weight: .bold))
                }
                
                if remaining == 0 && total > 0 {
                    Text("Hepsi Tamam! 🎉")
                        .font(.system(size: 14, weight: .medium))
                } else if total == 0 {
                    Text("Görev Yok")
                        .font(.system(size: 14, weight: .medium))
                } else {
                    Text("\(remaining) Görev Kaldı")
                        .font(.system(size: 14, weight: .medium))
                    // Minik Progress Bar
                    ProgressView(value: progress)
                        .progressViewStyle(.linear)
                        .tint(.white)
                }
            }
        case .accessoryInline:
            Text("\(remaining) Görev Kaldı")
        default:
            EmptyView()
        }
    }
}

// B. Kilit Ekranı ALIŞKANLIKLAR
struct HabitsLockScreenView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        let total = entry.habits.count
        let completed = entry.habits.filter { $0.isCompleted }.count
        let progress = total > 0 ? Double(completed) / Double(total) : 0
        
        switch family {
        case .accessoryCircular:
            Gauge(value: progress) {
                Image(systemName: "flame.fill")
                    .font(.system(size: 12))
            }
            .gaugeStyle(.accessoryCircular)
            
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Image(systemName: "flame")
                    Text("ALIŞKANLIKLAR")
                        .font(.system(size: 12, weight: .bold))
                }
                
                Text("%\(Int(progress * 100)) Tamamlandı")
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                
                ProgressView(value: progress)
                    .progressViewStyle(.linear)
            }
        case .accessoryInline:
            Text("\(completed)/\(total) Alışkanlık")
        default:
            EmptyView()
        }
    }
}

// MARK: - 5. ANA GÖRÜNÜMLER (HOME + LOCK SCREEN BİRLEŞİMİ)

// GÖREVLER İÇİN
struct TasksWidgetView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family
    let themeColor = Color(red: 0.39, green: 0.40, blue: 0.95)

    var body: some View {
        // Eğer Kilit Ekranı modundaysak oraya yönlendir
        if family == .accessoryRectangular || family == .accessoryCircular || family == .accessoryInline {
            TasksLockScreenView(entry: entry)
                .widgetURL(URL(string: "ommioapp://?tab=list"))
        } else {
            // Yoksa Ana Ekran Tasarımını Göster (Mevcut Tasarım)
            GeometryReader { geometry in
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Text("GÖREVLER")
                            .font(.system(size: 10, weight: .black, design: .rounded))
                            .foregroundStyle(themeColor)
                            .tracking(0.5)
                        Spacer()
                        Text(entry.date.formatted(.dateTime.day().month()))
                            .font(.system(size: 10, weight: .semibold, design: .rounded))
                            .foregroundStyle(.secondary)
                    }
                    .padding(.bottom, 6)
                    
                    if !entry.tasks.isEmpty {
                        let completedCount = entry.tasks.filter { $0.isCompleted }.count
                        ProgressBar(completed: completedCount, total: entry.tasks.count, color: themeColor)
                            .padding(.bottom, 10)
                    } else {
                        Divider().padding(.bottom, 10).opacity(0)
                    }

                    if entry.tasks.isEmpty {
                        EmptyStateView(icon: "star.fill", color: .yellow, text: "Görevler Tamam!")
                    } else {
                        VStack(alignment: .leading, spacing: 6) {
                            let limit: Int = family == .systemLarge ? 8 : (family == .systemMedium ? 4 : 3)
                            ForEach(Array(entry.tasks.prefix(limit).enumerated()), id: \.element.id) { _, item in
                                ItemRowView(item: item, color: themeColor)
                            }
                            if entry.tasks.count > limit {
                                Link(destination: URL(string: "ommioapp://?tab=list")!) {
                                    HStack { Spacer(); Text("+ \(entry.tasks.count - limit) diğer").font(.system(size: 10, weight: .bold, design: .rounded)).foregroundStyle(themeColor); Spacer() }.padding(.top, 2)
                                }
                            }
                        }
                    }
                    Spacer(minLength: 0)
                }
                .padding(16)
            }
            .widgetURL(URL(string: "ommioapp://?tab=list"))
        }
    }
}

// ALIŞKANLIKLAR İÇİN
struct HabitsWidgetView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family
    let themeColor = Color.orange

    var body: some View {
        if family == .accessoryRectangular || family == .accessoryCircular || family == .accessoryInline {
            HabitsLockScreenView(entry: entry)
                .widgetURL(URL(string: "ommioapp://?tab=habits"))
        } else {
            GeometryReader { geometry in
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        Text("ALIŞKANLIKLAR")
                            .font(.system(size: 10, weight: .black, design: .rounded))
                            .foregroundStyle(themeColor)
                            .tracking(0.5)
                        Spacer()
                        Text(entry.date.formatted(.dateTime.weekday(.abbreviated)))
                            .font(.system(size: 10, weight: .semibold, design: .rounded))
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)
                    }
                    .padding(.bottom, 6)
                    
                    if !entry.habits.isEmpty {
                        let completedCount = entry.habits.filter { $0.isCompleted }.count
                        ProgressBar(completed: completedCount, total: entry.habits.count, color: themeColor)
                            .padding(.bottom, 10)
                    } else {
                        Divider().padding(.bottom, 10).opacity(0)
                    }

                    if entry.habits.isEmpty {
                        EmptyStateView(icon: "flame.fill", color: .orange, text: "Bugünlük boş.")
                    } else {
                        VStack(alignment: .leading, spacing: 6) {
                            let limit: Int = family == .systemLarge ? 8 : (family == .systemMedium ? 4 : 3)
                            ForEach(Array(entry.habits.prefix(limit).enumerated()), id: \.element.id) { _, item in
                                ItemRowView(item: item, color: themeColor, isHabit: true)
                            }
                            if entry.habits.count > limit {
                                Link(destination: URL(string: "ommioapp://?tab=habits")!) {
                                    HStack { Spacer(); Text("+ \(entry.habits.count - limit) diğer").font(.system(size: 10, weight: .bold, design: .rounded)).foregroundStyle(themeColor); Spacer() }.padding(.top, 2)
                                }
                            }
                        }
                    }
                    Spacer(minLength: 0)
                }
                .padding(16)
            }
            .widgetURL(URL(string: "ommioapp://?tab=habits"))
        }
    }
}

// MARK: - YARDIMCI GÖRÜNÜMLER
struct ProgressBar: View {
    let completed: Int; let total: Int; let color: Color
    var progress: Double { total == 0 ? 0 : Double(completed) / Double(total) }
    var body: some View {
        HStack(spacing: 8) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(color.opacity(0.2))
                    Capsule().fill(color).frame(width: geo.size.width * progress)
                }
            }.frame(height: 4)
            Text("\(Int(progress * 100))%").font(.system(size: 9, weight: .bold, design: .rounded)).foregroundStyle(color)
        }
    }
}

struct ItemRowView: View {
    let item: ItemData; let color: Color; var isHabit: Bool = false
    @Environment(\.colorScheme) var colorScheme
    var body: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle().stroke(item.isCompleted ? .green : color.opacity(0.3), lineWidth: 1.5).frame(width: 16, height: 16)
                if item.isCompleted { Image(systemName: "checkmark").font(.system(size: 10, weight: .bold)).foregroundStyle(.green) }
            }
            Text(item.title).font(.system(size: 12, weight: .medium, design: .rounded)).strikethrough(item.isCompleted, color: .secondary).foregroundStyle(item.isCompleted ? .secondary : .primary).lineLimit(1)
            Spacer()
        }
        .padding(.vertical, 8).padding(.horizontal, 10)
        .background(RoundedRectangle(cornerRadius: 12).fill(colorScheme == .dark ? Color.white.opacity(0.08) : Color.black.opacity(0.03)))
    }
}

struct EmptyStateView: View {
    let icon: String; let color: Color; let text: String
    var body: some View {
        VStack(spacing: 6) {
            Spacer()
            Image(systemName: icon).font(.system(size: 24)).foregroundStyle(color).padding(12).background(Circle().fill(color.opacity(0.15)))
            Text(text).font(.system(size: 12, weight: .bold, design: .rounded)).foregroundStyle(.primary)
            Text("Harikasın!").font(.system(size: 10, weight: .medium, design: .rounded)).foregroundStyle(.secondary)
            Spacer()
        }.frame(maxWidth: .infinity)
    }
}

// MARK: - 6. Widget Bundle
@main
struct OmmioWidgetBundle: WidgetBundle {
    var body: some Widget {
        OmmioTasksWidget()
        OmmioHabitsWidget()
    }
}

struct OmmioTasksWidget: Widget {
    let kind: String = "OmmioTasksWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                TasksWidgetView(entry: entry).containerBackground(for: .widget) { Color(.systemBackground) }
            } else {
                TasksWidgetView(entry: entry).background(Color(.systemBackground))
            }
        }
        .configurationDisplayName("Ommio Görevler")
        .description("Günlük görevlerini takip et.")
        // 👇 KİLİT EKRANI DESTEĞİ EKLENDİ (.accessory...)
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular, .accessoryInline])
        .contentMarginsDisabled()
    }
}

struct OmmioHabitsWidget: Widget {
    let kind: String = "OmmioHabitsWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                HabitsWidgetView(entry: entry).containerBackground(for: .widget) { Color(.systemBackground) }
            } else {
                HabitsWidgetView(entry: entry).background(Color(.systemBackground))
            }
        }
        .configurationDisplayName("Ommio Alışkanlıklar")
        .description("Alışkanlık zincirini kırma!")
        // 👇 KİLİT EKRANI DESTEĞİ EKLENDİ (.accessory...)
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular, .accessoryInline])
        .contentMarginsDisabled()
    }
}
