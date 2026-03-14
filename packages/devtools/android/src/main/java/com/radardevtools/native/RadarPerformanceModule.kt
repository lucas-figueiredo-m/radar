package com.radardevtools.native

import android.os.Debug
import android.view.Choreographer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.radardevtools.native.NativeRadarPerformanceSpec
import java.io.RandomAccessFile

@ReactModule(name = RadarPerformanceModule.NAME)
class RadarPerformanceModule(reactContext: ReactApplicationContext) :
    NativeRadarPerformanceSpec(reactContext), Choreographer.FrameCallback {

    companion object {
        const val NAME = "RadarPerformance"
    }

    private var frameCount = 0
    private var lastFrameTimeNanos = 0L
    private var currentUiFps = 0.0

    private var lastCpuTimeMs = 0L
    private var lastWallTimeMs = 0L

    override fun getName(): String = NAME

    override fun initialize() {
        super.initialize()
        Choreographer.getInstance().postFrameCallback(this)
    }

    override fun doFrame(frameTimeNanos: Long) {
        if (lastFrameTimeNanos == 0L) {
            lastFrameTimeNanos = frameTimeNanos
            frameCount = 0
        } else {
            frameCount++
            val elapsedSec = (frameTimeNanos - lastFrameTimeNanos) / 1_000_000_000.0
            if (elapsedSec >= 1.0) {
                currentUiFps = frameCount / elapsedSec
                frameCount = 0
                lastFrameTimeNanos = frameTimeNanos
            }
        }
        Choreographer.getInstance().postFrameCallback(this)
    }

    private fun getNativeRam(): Double {
        return Debug.getNativeHeapAllocatedSize().toDouble()
    }

    private fun getCpuUsage(): Double {
        try {
            val reader = RandomAccessFile("/proc/self/stat", "r")
            val line = reader.readLine()
            reader.close()

            val parts = line.split(" ")
            val cpuTimeMs = (parts[13].toLong() + parts[14].toLong()) * 10
            val wallTimeMs = System.currentTimeMillis()

            if (lastCpuTimeMs == 0L) {
                lastCpuTimeMs = cpuTimeMs
                lastWallTimeMs = wallTimeMs
                return 0.0
            }

            val cpuDelta = cpuTimeMs - lastCpuTimeMs
            val wallDelta = wallTimeMs - lastWallTimeMs

            lastCpuTimeMs = cpuTimeMs
            lastWallTimeMs = wallTimeMs

            return if (wallDelta > 0) {
                (cpuDelta.toDouble() / wallDelta.toDouble()) * 100.0
            } else {
                0.0
            }
        } catch (e: Exception) {
            return 0.0
        }
    }

    override fun getMetrics(): WritableMap {
        val map = Arguments.createMap()
        map.putInt("uiFps", Math.round(currentUiFps).toInt())
        map.putDouble("nativeRam", getNativeRam())
        map.putDouble("cpuUsage", getCpuUsage())
        return map
    }
}
