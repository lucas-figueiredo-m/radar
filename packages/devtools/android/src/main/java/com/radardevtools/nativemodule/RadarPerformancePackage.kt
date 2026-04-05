package com.radardevtools.nativemodule

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class RadarPerformancePackage : TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == RadarPerformanceModule.NAME) {
            RadarPerformanceModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                RadarPerformanceModule.NAME to ReactModuleInfo(
                    RadarPerformanceModule.NAME,
                    RadarPerformanceModule.NAME,
                    false,
                    false,
                    false,
                    true
                )
            )
        }
    }
}
