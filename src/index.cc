#include <napi.h>
#include "MusicPlayer.h"

#include "../musicplayer/plugins/plugins.h"

using musix::ChipPlayer;
using musix::ChipPlugin;

static void loadPlugins(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  printf("LOADING PLUGINS\n");
  std::string dataDir = info[0].As<Napi::String>().Utf8Value();
  ChipPlugin::createPlugins(dataDir);
}

static Napi::Object Init(Napi::Env env, Napi::Object exports) {
  MusicPlayer::Init(env, exports);
  exports.Set(Napi::String::New(env, "loadPlugins"),
              Napi::Function::New(env, loadPlugins));
  return exports;
}

NODE_API_MODULE(musicplayer_node, Init)
