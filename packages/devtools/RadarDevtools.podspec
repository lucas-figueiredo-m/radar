require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = "RadarDevtools"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/lucas-figueiredo-m/radar"
  s.license      = "MIT"
  s.author       = "Lucas Figueiredo"
  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/lucas-figueiredo-m/radar.git", :tag => s.version }
  s.source_files = "ios/*.{h,mm}"

  install_modules_dependencies(s)
end
