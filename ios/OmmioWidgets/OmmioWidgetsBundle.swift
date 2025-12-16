//
//  OmmioWidgetsBundle.swift
//  OmmioWidgets
//
//  Created by Enes Berkay Bayram on 15/12/2025.
//

import WidgetKit
import SwiftUI

@main
struct OmmioWidgetsBundle: WidgetBundle {
    var body: some Widget {
        OmmioWidgets()
        OmmioWidgetsControl()
        OmmioWidgetsLiveActivity()
    }
}
