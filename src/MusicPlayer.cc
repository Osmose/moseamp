#include <napi.h>
#include <vector>

#include "MusicPlayer.h"
#include "../musicplayer/plugins/gmeplugin/GMEPlugin.cpp"

Napi::Object MusicPlayer::Init(Napi::Env env, Napi::Object exports) {
    // This method is used to hook the accessor and method callbacks
    Napi::Function func = DefineClass(env, "MusicPlayer", {
        InstanceMethod("getMeta", &MusicPlayer::getMeta),
        InstanceMethod("getMetaInt", &MusicPlayer::getMetaInt),
        InstanceMethod("seek", &MusicPlayer::seek),
        InstanceMethod("freePlayer", &MusicPlayer::freePlayer),
        InstanceMethod("play", &MusicPlayer::play),
        InstanceMethod("nesAnalysis", &MusicPlayer::nesAnalysis),
    });
    exports.Set("MusicPlayer", func);
    return exports;
}

MusicPlayer::MusicPlayer(const Napi::CallbackInfo& info) : Napi::ObjectWrap<MusicPlayer>(info) {
  Napi::Env env = info.Env();

  std::string strName = info[0].As<Napi::String>().Utf8Value();
  const char *name = strName.c_str();

  // Load chipplayer instance
  ChipPlayer* chipPlayer;
  for(auto &plugin : ChipPlugin::getPlugins()) {
    if(plugin->canHandle(name)) {
      auto ptr = plugin->fromFile(name);
      if(ptr != nullptr) {
        chipPlayer = ptr;
        break;
      }
    }
  }

  if(!chipPlayer) {
    Napi::Error::New(env, "MusicPlayer: no plugin could handle file").ThrowAsJavaScriptException();
    return;
  }

  this->chipPlayer = chipPlayer;
}

Napi::Value MusicPlayer::getMeta(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    std::string metaName = info[0].As<Napi::String>().Utf8Value();
    std::string result = this->chipPlayer->getMeta(metaName);
    return Napi::String::New(env, result);
}

Napi::Value MusicPlayer::getMetaInt(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    std::string metaName = info[0].As<Napi::String>().Utf8Value();
    int result = this->chipPlayer->getMetaInt(metaName);
    return Napi::Number::New(env, result);
}

Napi::Value MusicPlayer::nesAnalysis(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    Napi::Object returnValue = Napi::Object::New(env);

    musix::GMEPlayer* gmePlayer = dynamic_cast<musix::GMEPlayer*>(this->chipPlayer);
    musix::nesAnalysis result = gmePlayer->getNesAnalysis();

    returnValue.Set("square1Period", result.square1Period);
    returnValue.Set("square1Volume", result.square1Volume);
    returnValue.Set("square2Period", result.square2Period);
    returnValue.Set("square2Volume", result.square2Volume);
    returnValue.Set("trianglePeriod", result.trianglePeriod);
    returnValue.Set("triangleCounter", result.triangleCounter);
    returnValue.Set("noiseRate", result.noiseRate);
    returnValue.Set("noiseVolume", result.noiseVolume);
    returnValue.Set("dpcmPlaying", result.dpcmPlaying);

    returnValue.Set("vrc6Square1Period", result.vrc6Square1Period);
    returnValue.Set("vrc6Square1Volume", result.vrc6Square1Volume);
    returnValue.Set("vrc6Square2Period", result.vrc6Square2Period);
    returnValue.Set("vrc6Square2Volume", result.vrc6Square2Volume);
    returnValue.Set("vrc6SawPeriod", result.vrc6SawPeriod);
    returnValue.Set("vrc6SawVolume", result.vrc6SawVolume);

    return returnValue;
}

void MusicPlayer::seek(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    int song = info[0].As<Napi::Number>().Uint32Value();
    this->chipPlayer->seekTo(song, 0);
}

void MusicPlayer::freePlayer(const Napi::CallbackInfo& info) {
    delete this->chipPlayer;
}

Napi::Value MusicPlayer::play(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  int size = info[0].As<Napi::Number>().Uint32Value();
  Napi::Int16Array samples = Napi::Int16Array::New(env, size);

  this->chipPlayer->getSamples(reinterpret_cast<int16_t *>(samples.Data()), size);

  return samples;
}
