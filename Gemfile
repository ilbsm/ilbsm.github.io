source "https://rubygems.org"

group :jekyll_plugins do
  # Match the dependency set used by GitHub Pages builds.
  gem "github-pages", "~> 232"
end

# Windows / JRuby compatibility
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Performance booster for watching directories on Windows
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
