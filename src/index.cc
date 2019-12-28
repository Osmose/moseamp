#include <nan.h>
#include "MusicPlayer.h"

#include "../musicplayer/plugins/plugins.h"

using musix::ChipPlayer;
using musix::ChipPlugin;

void loadPlugins(const Nan::FunctionCallbackInfo<v8::Value>& args) {
  printf("LOADING PLUGINS\n");
  v8::String::Utf8Value dataDir(args[0]->ToString());
  std::string strDataDir = std::string(*dataDir);
  printf("Plugin dir: %s", strDataDir.c_str());
  ChipPlugin::createPlugins(strDataDir);
  printf("PLUGInS LOADED\n");
}

void initModule(v8::Local<v8::Object> exports) {
  v8::Local<v8::Context> context = exports->CreationContext();

  // Export MusicPlayer
  MusicPlayer::init(exports);

  // export loadPlugins
  exports->Set(
    context,
    Nan::New("loadPlugins").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(loadPlugins)->GetFunction(context).ToLocalChecked()
  );
}

NODE_MODULE(musicplayer_node, initModule)
