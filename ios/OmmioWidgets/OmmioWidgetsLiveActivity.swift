//
//  OmmioWidgetsLiveActivity.swift
//  OmmioWidgets
//
//  Created by Enes Berkay Bayram on 15/12/2025.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct OmmioWidgetsAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct OmmioWidgetsLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: OmmioWidgetsAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension OmmioWidgetsAttributes {
    fileprivate static var preview: OmmioWidgetsAttributes {
        OmmioWidgetsAttributes(name: "World")
    }
}

extension OmmioWidgetsAttributes.ContentState {
    fileprivate static var smiley: OmmioWidgetsAttributes.ContentState {
        OmmioWidgetsAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: OmmioWidgetsAttributes.ContentState {
         OmmioWidgetsAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: OmmioWidgetsAttributes.preview) {
   OmmioWidgetsLiveActivity()
} contentStates: {
    OmmioWidgetsAttributes.ContentState.smiley
    OmmioWidgetsAttributes.ContentState.starEyes
}
