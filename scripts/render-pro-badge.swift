// Regenerate on macOS with: xcrun swift scripts/render-pro-badge.swift
// Owner-authorized web wordmark, matching DynamicLand/ProBadge.swift.
// Isolated SwiftUI asset export: this does not build or launch the native app.
// The native shadow is applied by CSS so it is not cropped by the image bounds.
import AppKit
import SwiftUI

try MainActor.assumeIsolated {
    let fontSize: CGFloat = 32
    let blue = Color(red: 0.231, green: 0.251, blue: 0.996)
    let purple = Color(red: 0.510, green: 0.282, blue: 0.965)
    let lilac = Color(red: 0.769, green: 0.380, blue: 0.976)
    let peach = Color(red: 0.914, green: 0.592, blue: 0.478)

    let badge = Text("PRO")
        .font(.system(size: fontSize, weight: .bold, design: .rounded))
        .foregroundStyle(.white)
        .padding(.horizontal, fontSize * 0.6)
        .padding(.vertical, fontSize * 0.2)
        .background {
            MeshGradient(width: 3, height: 3, points: [
                [0, 0], [0.5, 0], [1, 0],
                [0, 0.5], [0.5, 0.5], [1, 0.5],
                [0, 1], [0.5, 1], [1, 1]
            ], colors: [
                blue, purple, blue,
                lilac, peach, lilac,
                purple, blue, purple
            ])
        }
        .clipShape(RoundedRectangle(cornerRadius: fontSize * 0.6, style: .continuous))
        .environment(\.colorScheme, .light)

    let renderer = ImageRenderer(content: badge)
    renderer.scale = 4
    guard let image = renderer.cgImage else {
        fatalError("Unable to render the Pro wordmark")
    }
    let bitmap = NSBitmapImageRep(cgImage: image)
    guard let png = bitmap.representation(using: .png, properties: [:]) else {
        fatalError("Unable to encode the Pro wordmark")
    }
    let destination = URL(fileURLWithPath: "public/brand/pro-badge.png")
    try png.write(to: destination)
    print("Exported \(image.width)×\(image.height) pixels to \(destination.lastPathComponent)")
}
