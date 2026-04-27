source "https://rubygems.org"

# Pin to a Jekyll version compatible with GitHub Pages by default.
# If you don't deploy to GitHub Pages, you can use plain Jekyll instead.
gem "jekyll", "~> 4.3"

# Optional but commonly needed:
gem "kramdown-parser-gfm"

group :jekyll_plugins do
  # add plugins here if needed; none required for this site
end

# Windows / JRuby compatibility
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Performance booster for watching directories on Windows
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
