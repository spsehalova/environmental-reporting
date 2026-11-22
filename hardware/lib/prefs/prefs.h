#pragma once
#include <Preferences.h>

extern Preferences prefs;

String loadPref(const char *pref_namespace, const char *key, const String &fallback);