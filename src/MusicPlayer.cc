#include <vector>

#include "MusicPlayer.h"

NAN_MODULE_INIT(MusicPlayer::init) {
  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(MusicPlayer::New);
  tpl->SetClassName(Nan::New("MusicPlayer").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Nan::SetPrototypeMethod(tpl, "getMeta", getMeta);
  Nan::SetPrototypeMethod(tpl, "getMetaInt", getMetaInt);
  Nan::SetPrototypeMethod(tpl, "seek", seek);
  Nan::SetPrototypeMethod(tpl, "freePlayer", freePlayer);
  Nan::SetPrototypeMethod(tpl, "play", play);

  constructor().Reset(Nan::GetFunction(tpl).ToLocalChecked());
  Nan::Set(
    target,
    Nan::New("MusicPlayer").ToLocalChecked(),
    Nan::GetFunction(tpl).ToLocalChecked()
  );
}

NAN_METHOD(MusicPlayer::New) {
  // create a new instance and wrap our javascript instance
  MusicPlayer* musicPlayer = new MusicPlayer();
  musicPlayer->Wrap(info.Holder());

  v8::String::Utf8Value utfName(info[0]->ToString());
  std::string strName = std::string(*utfName);
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
    return Nan::ThrowError(Nan::New("MusicPlayer::New - no plugin could handle file").ToLocalChecked());
  }

  musicPlayer->chipPlayer = chipPlayer;

  // return the wrapped javascript instance
  info.GetReturnValue().Set(info.Holder());
}

NAN_METHOD(MusicPlayer::getMeta) {
  v8::Isolate* isolate = info.GetIsolate();
  MusicPlayer* self = Nan::ObjectWrap::Unwrap<MusicPlayer>(info.This());

  v8::String::Utf8Value utfMetaName(info[0]->ToString());
  std::string strMetaName = std::string(*utfMetaName);

  std::string result = self->chipPlayer->getMeta(strMetaName);

  info.GetReturnValue().Set(v8::String::NewFromUtf8(isolate, result.c_str(), v8::NewStringType::kNormal).ToLocalChecked());
}

NAN_METHOD(MusicPlayer::getMetaInt) {
  MusicPlayer* self = Nan::ObjectWrap::Unwrap<MusicPlayer>(info.This());

  v8::String::Utf8Value utfMetaName(info[0]->ToString());
  std::string strMetaName = std::string(*utfMetaName);

  int result = self->chipPlayer->getMetaInt(strMetaName);

  info.GetReturnValue().Set(result);
}

NAN_METHOD(MusicPlayer::seek) {
  MusicPlayer* self = Nan::ObjectWrap::Unwrap<MusicPlayer>(info.This());

  int song = info[0]->IntegerValue();
  self->chipPlayer->seekTo(song, 0);
}

NAN_METHOD(MusicPlayer::freePlayer) {
  MusicPlayer* self = Nan::ObjectWrap::Unwrap<MusicPlayer>(info.This());

  delete self->chipPlayer;
}

NAN_METHOD(MusicPlayer::play) {
  printf("PLAY\n");
  MusicPlayer* self = Nan::ObjectWrap::Unwrap<MusicPlayer>(info.This());

  int size = info[0]->IntegerValue();
  std::vector<int16_t> samples(size, 0);
  printf("SAMPLES %u\n", size);

  self->chipPlayer->getSamples(&samples[0], size);

  printf("got samples\n");
  v8::Local<v8::Array> returnSamples = Nan::New<v8::Array>(size);
  for (int i = 0; i < size; i++) {
    Nan::Set(returnSamples, i, Nan::New(samples.at(i)));
  }
  printf("samples transferred\n");

  info.GetReturnValue().Set(returnSamples);
}
