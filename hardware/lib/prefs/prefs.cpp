#include "prefs.h"
#include <sys/_intsup.h>

Preferences prefs;

String loadPref(const char *pref_namespace, const char *key, const String &fallback) {
	prefs.begin(pref_namespace, true);
	String value = prefs.getString(key, fallback);
	prefs.end();
	return value;
}