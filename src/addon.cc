#include <nan.h>
// #include "minkowski.h"

using Nan::GetFunction;
using Nan::New;
using Nan::Set;
using v8::FunctionTemplate;
using v8::Local;
using v8::Object;
using v8::String;

NAN_METHOD(calculateNFP);

NAN_MODULE_INIT(Init)
{
  Nan::SetMethod(target, "calculateNFP", calculateNFP);
}

NAN_MODULE_WORKER_ENABLED(addon, Init)