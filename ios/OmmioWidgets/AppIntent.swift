//
//  AppIntent.swift
//  OmmioWidgets
//
//  Created by Enes Berkay Bayram on 15/12/2025.
//

import WidgetKit
import AppIntents

struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Configuration" }
    static var description: IntentDescription { "This is an example widget." }

    // An example configurable parameter.
    @Parameter(title: "Favorite Emoji", default: "😃")
    var favoriteEmoji: String
  func perform() async throws -> some IntentResult {
          return .result()
      }
}
