import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Animated, Dimensions, StatusBar, Keyboard,
  Image, Pressable, LayoutAnimation, UIManager
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useAuthStore from "../../store/useAuthStore";
import {
  STATE_OPTIONS,
  getDistrictOptions,
  AGE_GROUP_OPTIONS,
  GENDER_OPTIONS,
  QUALIFICATION_OPTIONS,
  PRESENT_STATUS_OPTIONS,
  LOOKING_FOR_OPTIONS,
} from "../../utils/formOptions";

const { width: W } = Dimensions.get("window");
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
// ─── TOKENS ──────────────────────────────────────────────────
const C = {
  primary: "#E53935",
  primaryDark: "#B71C1C",
  primaryLight: "#FFEBEE",
  secondary: "#000000",
  accent: "#FF5252",
  accentOrange: "#FF3D00",
  bg: "#FFFFFF",
  white: "#FFFFFF",
  card: "#F9F9F9",
  text: "#000000",
  textSec: "#555555",
  textLight: "#9CA3AF",
  border: "#E5E7EB",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#E53935",
  star: "#FBBF24",
};

const F = { xs: 11, sm: 13, base: 14, md: 15, lg: 17, xl: 20, xxl: 26 };

// ─── KEYBOARD SAFE WRAPPER ────────────────────────────────────
function KBSafe({ children, bottomPad = 140, scrollRef }) {
  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          ref={scrollRef}
          style={s.flex}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomPad }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
        >
          {children}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

function Brand({ title, sub }) {
  return (
    <View style={s.brand}>
      <Image
        source={require("../../assets/logo.jpg")}
        style={{ width: 120, height: 120 }}
        resizeMode="contain"
      />
      <Text style={s.brandTitle}>{title}</Text>
      <Text style={s.brandSub}>{sub}</Text>
    </View>
  );
}

// ─── GRID ─────────────────────────────────────────────────────
const Row = ({ children }) => <View style={s.row}>{children}</View>;
const Col = ({ children }) => <View style={s.col}>{children}</View>;

const Label = ({ text, required }) => (
  <Text style={s.label}>
    {text}
    {required ? <Text style={{ color: C.error }}> *</Text> : null}
  </Text>
);

const Section = ({ title }) => (
  <View style={s.section}>
    <View style={s.sectionBar} />
    <Text style={s.sectionTxt}>{title}</Text>
  </View>
);

// ─── FIELD ────────────────────────────────────────────────────
function Field({
  label, required,
  icon, placeholder, value, onChangeText, error,
  secureTextEntry = false, keyboardType = "default",
  rightEl, editable = true, scrollRef, scrollY = 0,
  autoCapitalize = "none", maxLength,
}) {
  const [focused, setFocused] = useState(false);
  const bAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(bAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();

    if (scrollRef?.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo?.({ y: scrollY, animated: true });
      }, 150);
    }
  };

  const onBlur = () => {
    setFocused(false);
    Animated.timing(bAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const borderColor = bAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? C.error : C.border, error ? C.error : C.primary],
  });
  const bw = bAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });

  return (
    <View style={s.fieldWrap}>
      {!!label && <Label text={label} required={required} />}

      <Animated.View style={[s.fieldBox, { borderColor, borderWidth: bw }]}>
        <Ionicons
          name={icon} size={17}
          color={error ? C.error : focused ? C.primary : C.textLight}
          style={s.fieldIcon}
        />
        <TextInput
          style={s.fieldInput}
          placeholder={placeholder}
          placeholderTextColor={C.textLight}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          maxLength={maxLength}
          returnKeyType="next"
        />
        {rightEl}
      </Animated.View>

      {!!error && (
        <View style={s.fieldErr}>
          <Ionicons name="alert-circle" size={12} color={C.error} />
          <Text style={s.fieldErrTxt}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ─── SELECT FIELD — custom inline dropdown (no Picker, no Modal) ───
function SelectField({
  label, required, icon, placeholder = "Select",
  value, onValueChange, options = [], error, disabled = false,
  searchable = false,          // set true for long lists (State)
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const locked = disabled || !options.length;

  // close if options change out from under it (state → district reset)
  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [options]);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const toggle = () => {
    if (locked) return;
    Keyboard.dismiss();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => !o);
    setQuery("");
  };

  const pick = (opt) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onValueChange(opt.value);
    setOpen(false);
    setQuery("");
  };

  return (
    <View style={s.fieldWrap}>
      {!!label && <Label text={label} required={required} />}

      <Pressable
        onPress={toggle}
        style={[
          s.fieldBox,
          {
            borderWidth: open ? 2 : 1,
            borderColor: error ? C.error : open ? C.primary : C.border,
            opacity: locked ? 0.55 : 1,
          },
          open && s.fieldBoxOpen,
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={error ? C.error : open ? C.primary : C.textLight}
          style={s.fieldIcon}
        />

        <Text
          style={[s.fieldInput, { color: selected ? C.text : C.textLight }]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>

        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={open ? C.primary : C.textLight}
        />
      </Pressable>

      {open && (
        <View style={s.ddPanel}>
          {searchable && (
            <View style={s.ddSearch}>
              <Ionicons name="search-outline" size={14} color={C.textLight} />
              <TextInput
                style={s.ddSearchInput}
                placeholder="Search..."
                placeholderTextColor={C.textLight}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                autoFocus
              />
              {!!query && (
                <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={15} color={C.textLight} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <ScrollView
            style={s.ddList}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {filtered.length === 0 ? (
              <Text style={s.ddEmpty}>No results</Text>
            ) : (
              filtered.map((o) => {
                const active = o.value === value;
                return (
                  <TouchableOpacity
                    key={String(o.value)}
                    style={[s.ddItem, active && s.ddItemActive]}
                    onPress={() => pick(o)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[s.ddItemTxt, active && s.ddItemTxtActive]}
                      numberOfLines={1}
                    >
                      {o.label}
                    </Text>
                    {active && (
                      <Ionicons name="checkmark" size={15} color={C.primary} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {!!error && (
        <View style={s.fieldErr}>
          <Ionicons name="alert-circle" size={12} color={C.error} />
          <Text style={s.fieldErrTxt}>{error}</Text>
        </View>
      )}
    </View>
  );
}
// ─── CHECKBOX ─────────────────────────────────────────────────
function CheckBox({ checked, onToggle, children, error }) {
  return (
    <View>
      <TouchableOpacity style={s.cbRow} onPress={onToggle} activeOpacity={0.7}>
        <View
          style={[
            s.cbBox,
            checked && s.cbBoxOn,
            error && !checked && { borderColor: C.error },
          ]}
        >
          {checked && <Ionicons name="checkmark" size={13} color={C.white} />}
        </View>
        <Text style={s.cbTxt}>{children}</Text>
      </TouchableOpacity>

      {!!error && (
        <View style={s.fieldErr}>
          <Ionicons name="alert-circle" size={12} color={C.error} />
          <Text style={s.fieldErrTxt}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ─── PASSWORD STRENGTH ────────────────────────────────────────
const pwStrength = (pw) => {
  if (!pw) return 0;
  let n = 0;
  if (pw.length >= 8) n++;
  if (/[A-Z]/.test(pw)) n++;
  if (/[0-9]/.test(pw)) n++;
  if (/[^A-Za-z0-9]/.test(pw)) n++;
  return n;
};
const STR_LBL = ["", "Weak", "Fair", "Good", "Strong"];
const STR_CLR = ["", C.error, C.warning, "#84CC16", C.success];

function StrBar({ password }) {
  const anim = useRef(new Animated.Value(0)).current;
  const str = pwStrength(password);

  useEffect(() => {
    Animated.spring(anim, { toValue: str / 4, useNativeDriver: false, tension: 60, friction: 8 }).start();
  }, [str]);

  if (!password) return null;

  const bw = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const bc = anim.interpolate({
    inputRange: [0.25, 0.5, 0.75, 1],
    outputRange: [C.error, C.warning, "#84CC16", C.success],
  });

  return (
    <View style={s.strRow}>
      <View style={s.strTrack}>
        <Animated.View style={[s.strFill, { width: bw, backgroundColor: bc }]} />
      </View>
      <Text style={[s.strLbl, { color: STR_CLR[str] }]}>{STR_LBL[str]}</Text>
    </View>
  );
}

// ─── PRIMARY BUTTON ───────────────────────────────────────────
function Btn({ label, onPress, loading, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    if (disabled || loading) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.5 : 1 }}>
      <TouchableOpacity onPress={press} activeOpacity={1} disabled={disabled || loading}>
        <LinearGradient
          colors={[C.primary, C.primaryDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.btn}
        >
          {loading
            ? <ActivityIndicator color={C.white} size="small" />
            : (
              <View style={s.btnInner}>
                <Text style={s.btnTxt}>{label}</Text>
                <Ionicons name="arrow-forward" size={15} color={C.white} />
              </View>
            )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── DIVIDER ──────────────────────────────────────────────────
function Div({ label = "or continue with" }) {
  return (
    <View style={s.divRow}>
      <View style={s.divLine} />
      <Text style={s.divTxt}>{label}</Text>
      <View style={s.divLine} />
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// LOGIN — password + OTP + forgot password
// ════════════════════════════════════════════════════════════
export function LoginScreen({ navigation }) {
  const [mode, setMode] = useState("password");
  const [reg, setReg] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const scrollRef = useRef(null);

  const { loginWithPassword, loginWithOtp, verifyOtp, resendLoginOtp } = useAuthStore();

  const clearErr = (k) => setErrors((e) => ({ ...e, [k]: null }));

  const switchMode = (m) => {
    if (m === mode) return;
    setMode(m);
    setOtp("");
    setOtpSent(false);
    setErrors({});
  };

  const handlePasswordLogin = async () => {
    Keyboard.dismiss();

    const e = {};
    if (!reg.trim()) e.reg = "Registration number required";
    if (!pass.trim()) e.pass = "Password required";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const r = await loginWithPassword(reg.trim(), pass);
      if (r.success) navigation.replace("Main");
      else Alert.alert("Login Failed", r.message);
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    Keyboard.dismiss();

    const e = {};
    if (!reg.trim()) e.reg = "Registration number required";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const r = await loginWithOtp(reg.trim());

      if (r.success) {
        setOtpSent(true);
        Alert.alert("OTP Sent", "OTP has been sent to your registered mobile number.");
      } else {
        Alert.alert("Login Failed", r.message);
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    Keyboard.dismiss();

    if (!otp.trim()) {
      Alert.alert("OTP Required", "Please enter OTP.");
      return;
    }

    setLoading(true);
    try {
      const r = await verifyOtp(reg.trim(), otp.trim());
      if (r.success) navigation.replace("Main");
      else Alert.alert("Verification Failed", r.message);
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const r = await resendLoginOtp(reg.trim());
      Alert.alert(r.success ? "Success" : "Error", r.message);
    } catch {
      Alert.alert("Error", "Unable to resend OTP.");
    }
  };

  const btn = mode === "password"
    ? { label: "Sign In", onPress: handlePasswordLogin }
    : otpSent
      ? { label: "Verify OTP", onPress: handleVerifyOtp }
      : { label: "Send OTP", onPress: handleSendOtp };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KBSafe bottomPad={140} scrollRef={scrollRef}>
        <View style={s.inner}>
          <Brand title="Welcome back" sub="Sign in to continue your journey" />

          <View style={s.card}>
            {!otpSent ? (
              <>
                <Field
                  label="Registration Number"
                  required
                  icon="id-card-outline"
                  placeholder="9712 xxxxxx"
                  value={reg}
                  onChangeText={(t) => { setReg(t); if (errors.reg) clearErr("reg"); }}
                  error={errors.reg}
                  autoCapitalize="characters"
                  scrollRef={scrollRef}
                  scrollY={0}
                />

                {mode === "password" && (
                  <>
                    <Field
                      label="Password"
                      required
                      icon="lock-closed-outline"
                      placeholder="Enter password"
                      secureTextEntry={!showPass}
                      value={pass}
                      onChangeText={(t) => { setPass(t); if (errors.pass) clearErr("pass"); }}
                      error={errors.pass}
                      scrollRef={scrollRef}
                      scrollY={60}
                      rightEl={
                        <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                          <Ionicons name={showPass ? "eye-off" : "eye"} size={18} color={C.textLight} />
                        </TouchableOpacity>
                      }
                    />

                    <TouchableOpacity
                      style={s.forgotBtn}
                      onPress={() => navigation.navigate("ForgotPassword")}
                    >
                      <Text style={s.forgotTxt}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </>
                )}

                {mode === "otp" && (
                  <Text style={s.hintTxt}>
                    We'll send a 4-digit OTP to your registered mobile number.
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={s.hintTxt}>
                  OTP has been sent to your registered mobile number.
                </Text>

                <Field
                  label="Enter OTP"
                  icon="key-outline"
                  placeholder="4-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  scrollRef={scrollRef}
                  scrollY={0}
                />

                <TouchableOpacity
                  onPress={() => { setOtp(""); setOtpSent(false); }}
                  style={{ alignSelf: "center", marginTop: 4 }}
                >
                  <Text style={s.linkTxt}>Change Registration Number</Text>
                </TouchableOpacity>

                <View style={s.switchRow}>
                  <Text style={s.switchTxt}>Didn't receive OTP? </Text>
                  <TouchableOpacity onPress={handleResendOtp}>
                    <Text style={s.switchLink}>Resend OTP</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <Btn label={btn.label} onPress={btn.onPress} loading={loading} />

            {!otpSent && (
              <>
                <Div label={mode === "password" ? "or sign in with OTP" : "or use password"} />

                <TouchableOpacity
                  style={s.altBtn}
                  onPress={() => switchMode(mode === "password" ? "otp" : "password")}
                >
                  <Ionicons
                    name={mode === "password" ? "keypad-outline" : "lock-closed-outline"}
                    size={17}
                    color={C.text}
                  />
                  <Text style={s.altBtnTxt}>
                    {mode === "password" ? "Login with OTP" : "Login with Password"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={s.switchRow}>
            <Text style={s.switchTxt}>New to EFOS? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={s.switchLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KBSafe>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════
// SIGNUP — full profile form
// ════════════════════════════════════════════════════════════
export function SignupScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    age_group: "",
    gender: "",
    highest_qualification: "",
    present_status: "",
    state: "",
    district: "",
    looking_for: "",
    password: "",
    password_confirmation: "",
    agree_terms: false,
  });

  const [showPass, setShowPass] = useState(false);
  const [showPassConf, setShowPassConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [errors, setErrors] = useState({});

  const { register, verifyRegisterOtp, resendRegisterOtp } = useAuthStore();
  const scrollRef = useRef(null);

  const districtOptions = useMemo(() => getDistrictOptions(form.state), [form.state]);

  const set = (key, value) => {
    setForm((f) =>
      key === "state"
        ? { ...f, state: value, district: "" }   // state change → district reset
        : { ...f, [key]: value }
    );
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};

    if (!form.name.trim()) e.name = "Name required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Valid email required";
    if (!/^\d{10}$/.test(form.phone.trim())) e.phone = "10-digit phone required";
    if (!form.age_group) e.age_group = "Required";
    if (!form.gender) e.gender = "Required";
    if (!form.highest_qualification) e.highest_qualification = "Required";
    if (!form.present_status) e.present_status = "Required";
    if (!form.state) e.state = "Required";
    if (!form.district) e.district = "Required";
    if (!form.looking_for) e.looking_for = "Required";
    if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (form.password !== form.password_confirmation) e.password_confirmation = "Passwords don't match";
    if (!form.agree_terms) e.agree_terms = "Please accept the terms to continue";

    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleRegister = async () => {
    Keyboard.dismiss();

    if (!validate()) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setLoading(true);
    try {
      const r = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        age_group: form.age_group,
        gender: form.gender,
        highest_qualification: form.highest_qualification,
        present_status: form.present_status,
        state: form.state,
        district: form.district,
        looking_for: form.looking_for,
        password: form.password,
        password_confirmation: form.password_confirmation,
        agree_terms: form.agree_terms,
      });

      if (r.success) {
        setRegistrationNumber(r.registration_number);
        setOtpSent(true);
        scrollRef.current?.scrollTo({ y: 0, animated: true });

        Alert.alert(
          "OTP Sent",
          `Registration number: ${r.registration_number}\nOTP sent to your mobile number.`
        );
      } else if (r.errors && typeof r.errors === "object" && Object.keys(r.errors).length) {
        setErrors(r.errors);
        Alert.alert("Registration Failed", "Please check the highlighted fields.");
      } else {
        Alert.alert(
          "Registration Failed",
          typeof r.message === "string" ? r.message : "Please check your details."
        );
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendRegisterOtp = async () => {
    try {
      const r = await resendRegisterOtp(registrationNumber);
      Alert.alert(r.success ? "Success" : "Error", r.message);
    } catch {
      Alert.alert("Error", "Unable to resend OTP.");
    }
  };

  const handleVerifyOtp = async () => {
    Keyboard.dismiss();

    if (!otp.trim()) {
      Alert.alert("OTP Required", "Please enter OTP.");
      return;
    }

    setLoading(true);
    try {
      const r = await verifyRegisterOtp(registrationNumber, otp.trim());
      if (r.success) navigation.replace("Main");
      else Alert.alert("Verification Failed", r.message);
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KBSafe bottomPad={200} scrollRef={scrollRef}>
        <View style={s.inner}>
          <Brand title="Create account" sub="Start your learning journey today" />

          <View style={s.card}>
            {!otpSent ? (
              <>
                <Section title="Personal Details" />

                <Field
                  label="Full Name"
                  required
                  icon="person-outline"
                  placeholder="Enter full name"
                  autoCapitalize="words"
                  value={form.name}
                  onChangeText={(t) => set("name", t)}
                  error={errors.name}
                  scrollRef={scrollRef}
                  scrollY={150}
                />

                <Field
                  label="Phone"
                  required
                  icon="call-outline"
                  placeholder="10-digit"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={form.phone}
                  onChangeText={(t) => set("phone", t.replace(/\D/g, ""))}
                  error={errors.phone}
                  scrollRef={scrollRef}
                  scrollY={220}
                />

                <SelectField
                  label="Age Group"
                  required
                  icon="calendar-outline"
                  placeholder="Select"
                  value={form.age_group}
                  onValueChange={(v) => set("age_group", v)}
                  options={AGE_GROUP_OPTIONS}
                  error={errors.age_group}
                />


                <Field
                  label="Email Address"
                  required
                  icon="mail-outline"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={(t) => set("email", t)}
                  error={errors.email}
                  scrollRef={scrollRef}
                  scrollY={290}
                />

                <SelectField
                  label="Gender"
                  required
                  icon="male-female-outline"
                  placeholder="Select"
                  value={form.gender}
                  onValueChange={(v) => set("gender", v)}
                  options={GENDER_OPTIONS}
                  error={errors.gender}
                />

                <SelectField
                  label="Qualification"
                  required
                  icon="school-outline"
                  placeholder="Select"
                  value={form.highest_qualification}
                  onValueChange={(v) => set("highest_qualification", v)}
                  options={QUALIFICATION_OPTIONS}
                  error={errors.highest_qualification}
                />



                <SelectField
                  label="Present Status"
                  required
                  icon="briefcase-outline"
                  placeholder="Select"
                  value={form.present_status}
                  onValueChange={(v) => set("present_status", v)}
                  options={PRESENT_STATUS_OPTIONS}
                  error={errors.present_status}
                />

                <SelectField
                  label="Looking For"
                  required
                  icon="compass-outline"
                  placeholder="Select"
                  value={form.looking_for}
                  onValueChange={(v) => set("looking_for", v)}
                  options={LOOKING_FOR_OPTIONS}
                  error={errors.looking_for}
                />


                <Section title="Location" />

                <Row>
                  <Col>
                    <SelectField
                      label="State"
                      required
                      icon="map-outline"
                      placeholder="Select State"
                      value={form.state}
                      onValueChange={(v) => set("state", v)}
                      options={STATE_OPTIONS}
                      error={errors.state}
                      searchable
                    />
                  </Col>
                  <Col>
                    <SelectField
                      label="District"
                      required
                      icon="location-outline"
                      placeholder={form.state ? "Select District" : "Pick state first"}
                      value={form.district}
                      onValueChange={(v) => set("district", v)}
                      options={districtOptions}
                      disabled={!form.state}
                      error={errors.district}
                      searchable
                    />
                  </Col>
                </Row>

                <Section title="Security" />

                <Field
                  label="Create Password"
                  required
                  icon="lock-closed-outline"
                  placeholder="Min 8 characters"
                  secureTextEntry={!showPass}
                  value={form.password}
                  onChangeText={(t) => set("password", t)}
                  error={errors.password}
                  scrollRef={scrollRef}
                  scrollY={580}
                  rightEl={
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      <Ionicons name={showPass ? "eye-off" : "eye"} size={18} color={C.textLight} />
                    </TouchableOpacity>
                  }
                />

                <StrBar password={form.password} />

                <Field
                  label="Confirm Password"
                  required
                  icon="shield-checkmark-outline"
                  placeholder="Re-enter password"
                  secureTextEntry={!showPassConf}
                  value={form.password_confirmation}
                  onChangeText={(t) => set("password_confirmation", t)}
                  error={errors.password_confirmation}
                  scrollRef={scrollRef}
                  scrollY={660}
                  rightEl={
                    <TouchableOpacity onPress={() => setShowPassConf(!showPassConf)}>
                      <Ionicons name={showPassConf ? "eye-off" : "eye"} size={18} color={C.textLight} />
                    </TouchableOpacity>
                  }
                />

                <CheckBox
                  checked={form.agree_terms}
                  onToggle={() => set("agree_terms", !form.agree_terms)}
                  error={errors.agree_terms}
                >
                  I agree to the Terms & Conditions and Privacy Policy
                </CheckBox>

                <Btn label="Create Account" onPress={handleRegister} loading={loading} />
              </>
            ) : (
              <>
                <Text style={s.hintTxt}>OTP sent to your registered mobile number.</Text>

                {!!registrationNumber && (
                  <View style={s.regBox}>
                    <Ionicons name="id-card-outline" size={16} color={C.primary} />
                    <Text style={s.regBoxTxt}>Reg. No: {registrationNumber}</Text>
                  </View>
                )}

                <Field
                  label="Enter OTP"
                  icon="key-outline"
                  placeholder="4-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  scrollRef={scrollRef}
                  scrollY={0}
                />

                <View style={s.switchRow}>
                  <Text style={s.switchTxt}>Didn't receive OTP? </Text>
                  <TouchableOpacity onPress={handleResendRegisterOtp}>
                    <Text style={s.switchLink}>Resend OTP</Text>
                  </TouchableOpacity>
                </View>

                <Btn label="Verify OTP" onPress={handleVerifyOtp} loading={loading} />
              </>
            )}
          </View>

          <View style={s.switchRow}>
            <Text style={s.switchTxt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={s.switchLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KBSafe>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ════════════════════════════════════════════════════════════
export function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { forgetPassword } = useAuthStore();
  const scrollRef = useRef(null);

  const handleSend = async () => {
    Keyboard.dismiss();

    const e = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Valid email required";
    if (newPass.length < 8) e.newPass = "Minimum 8 characters";
    if (newPass !== confPass) e.confPass = "Passwords don't match";
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const r = await forgetPassword(email.trim().toLowerCase(), newPass);
      if (r.success) setStep(2);
      else Alert.alert("Error", r.message || "Failed to send OTP");
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KBSafe bottomPad={160} scrollRef={scrollRef}>
        <View style={s.inner}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => (step === 2 ? setStep(1) : navigation.goBack())}
          >
            <Ionicons name="arrow-back" size={18} color={C.text} />
          </TouchableOpacity>

          <View style={s.iconBlock}>
            <LinearGradient colors={[C.primary, C.primaryDark]} style={s.iconCircle}>
              <Ionicons
                name={step === 1 ? "lock-open-outline" : "mail-unread-outline"}
                size={26} color={C.white}
              />
            </LinearGradient>
          </View>

          <View style={s.headBlock}>
            <Text style={s.headTitle}>{step === 1 ? "Reset Password" : "Check Email"}</Text>
            <Text style={s.headSub}>
              {step === 1
                ? "Enter your email and set a new password. We'll email you an OTP to confirm."
                : `OTP sent to ${email}`}
            </Text>
          </View>

          <View style={s.card}>
            {step === 1 ? (
              <>
                <Field
                  label="Email Address"
                  required
                  icon="mail-outline"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: null }); }}
                  error={errors.email}
                  scrollRef={scrollRef}
                  scrollY={140}
                />

                <Field
                  label="New Password"
                  required
                  icon="lock-closed-outline"
                  placeholder="Min 8 characters"
                  secureTextEntry={!showPass}
                  value={newPass}
                  onChangeText={(t) => { setNewPass(t); if (errors.newPass) setErrors({ ...errors, newPass: null }); }}
                  error={errors.newPass}
                  scrollRef={scrollRef}
                  scrollY={210}
                  rightEl={
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      <Ionicons name={showPass ? "eye-off" : "eye"} size={18} color={C.textLight} />
                    </TouchableOpacity>
                  }
                />

                <StrBar password={newPass} />

                <Field
                  label="Confirm New Password"
                  required
                  icon="shield-checkmark-outline"
                  placeholder="Re-enter password"
                  secureTextEntry={!showPass}
                  value={confPass}
                  onChangeText={(t) => { setConfPass(t); if (errors.confPass) setErrors({ ...errors, confPass: null }); }}
                  error={errors.confPass}
                  scrollRef={scrollRef}
                  scrollY={280}
                />

                <Btn label="Send OTP" onPress={handleSend} loading={loading} />
              </>
            ) : (
              <>
                <View style={s.successBox}>
                  <Ionicons name="checkmark-circle" size={20} color={C.success} />
                  <Text style={s.successTxt}>OTP sent successfully!</Text>
                </View>

                <Btn
                  label="Enter OTP"
                  onPress={() => navigation.navigate("OTP", { email: email.trim().toLowerCase() })}
                />
              </>
            )}
          </View>

          <View style={s.switchRow}>
            <Text style={s.switchTxt}>Remembered it? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={s.switchLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KBSafe>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════
// OTP (forget-password confirm)
// ════════════════════════════════════════════════════════════
export function OTPScreen({ route, navigation }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { email } = route.params || {};
  const { verifyForgetPasswordOtp, resendForgetPasswordOtp } = useAuthStore();

  const inputs = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 6, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
  ]).start();

  const handleChange = (i, v) => {
    if (v.length > 1) {
      const digits = v.replace(/\D/g, "").slice(0, 6).split("");
      const next = ["", "", "", "", "", ""];
      digits.forEach((d, idx) => (next[idx] = d));
      setOtp(next);
      setError("");
      inputs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }

    const next = [...otp];
    next[i] = v;
    setOtp(next);
    setError("");
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i, k) => {
    if (k === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    Keyboard.dismiss();

    const code = otp.join("");
    if (code.length !== 6) { setError("Enter all 6 digits"); shake(); return; }

    setLoading(true);
    try {
      const r = await verifyForgetPasswordOtp(email, code);

      if (r.success) {
        Alert.alert("Password Reset!", "You can now sign in with your new password.", [
          { text: "Sign In", onPress: () => navigation.replace("Login") },
        ]);
      } else {
        setError(r.message || "Invalid OTP");
        shake();
      }
    } catch {
      setError("Something went wrong.");
      shake();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const r = await resendForgetPasswordOtp(email);

      if (r.success) {
        setOtp(["", "", "", "", "", ""]);
        setError("");
        inputs.current[0]?.focus();
        Alert.alert("Success", r.message);
      } else {
        Alert.alert("Error", r.message || "Failed to resend");
      }
    } catch {
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KBSafe bottomPad={100}>
        <View style={s.inner}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={C.text} />
          </TouchableOpacity>

          <View style={s.iconBlock}>
            <LinearGradient colors={[C.primary, C.primaryDark]} style={s.iconCircle}>
              <Ionicons name="keypad-outline" size={26} color={C.white} />
            </LinearGradient>
          </View>

          <View style={s.headBlock}>
            <Text style={s.headTitle}>Enter OTP</Text>
            <Text style={s.headSub}>4-digit code sent to {email}</Text>
          </View>

          <View style={s.card}>
            <Animated.View style={[s.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
              {otp.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(r) => (inputs.current[i] = r)}
                  style={[s.otpBox, d && s.otpBoxFilled, error && s.otpBoxErr]}
                  maxLength={6}
                  keyboardType="number-pad"
                  value={d}
                  onChangeText={(v) => handleChange(i, v)}
                  onKeyPress={({ nativeEvent }) => handleKey(i, nativeEvent.key)}
                  editable={!loading}
                  selectTextOnFocus
                />
              ))}
            </Animated.View>

            {!!error && (
              <View style={s.errBox}>
                <Ionicons name="alert-circle" size={14} color={C.error} />
                <Text style={s.errTxt}>{error}</Text>
              </View>
            )}

            <Btn
              label="Verify OTP"
              onPress={handleVerify}
              loading={loading}
              disabled={otp.some((d) => !d)}
            />

            <View style={[s.switchRow, { marginTop: 8 }]}>
              <Text style={s.switchTxt}>Didn't receive it? </Text>
              <TouchableOpacity onPress={handleResend} disabled={loading}>
                <Text style={s.switchLink}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KBSafe>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  // Brand
  brand: { alignItems: "center", marginBottom: 20, paddingTop: 8 },
  brandTitle: { fontSize: 26, fontWeight: "800", color: C.text, marginBottom: 6, textAlign: "center", letterSpacing: -0.3 },
  brandSub: { fontSize: F.sm, color: C.textSec, textAlign: "center", lineHeight: 20 },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    padding: 16, gap: 12, marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },

  // Section heading
  section: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  sectionBar: { width: 3, height: 14, borderRadius: 2, backgroundColor: C.primary },
  sectionTxt: { fontSize: F.xs, fontWeight: "800", color: C.textSec, letterSpacing: 1 },

  // Grid
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1, minWidth: 0 },

  // Label
  label: { fontSize: F.xs, fontWeight: "700", color: C.textSec, marginBottom: 2, marginLeft: 2 },

  // Field
  fieldWrap: { gap: 4 },
  fieldBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    minHeight: 46,
  },
  fieldIcon: { marginRight: 8 },
  fieldInput: { flex: 1, fontSize: F.base, color: C.text, padding: 0 },
  fieldErr: { flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 2 },
  fieldErrTxt: { fontSize: F.xs, color: C.error, flex: 1 },

  hintTxt: { fontSize: F.sm, color: C.textSec, textAlign: "center", lineHeight: 20 },
  linkTxt: { fontSize: F.sm, color: "#0A84FF", fontWeight: "600" },

  // Picker bottom sheet

  fieldBoxOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  // Dropdown panel
  ddPanel: {
    marginTop: -4,
    backgroundColor: C.white,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: C.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  ddSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.card,
  },
  ddSearchInput: {
    flex: 1,
    fontSize: F.sm,
    color: C.text,
    padding: 0,
  },
  ddList: { maxHeight: 190 },
  ddItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  ddItemActive: { backgroundColor: C.primaryLight },
  ddItemTxt: { flex: 1, fontSize: F.sm, color: C.text },
  ddItemTxtActive: { fontWeight: "800", color: C.primaryDark },
  ddEmpty: {
    fontSize: F.sm,
    color: C.textLight,
    textAlign: "center",
    paddingVertical: 16,
  },
  // Checkbox
  cbRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 4 },
  cbBox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.white,
    alignItems: "center", justifyContent: "center",
    marginTop: 1,
  },
  cbBoxOn: { backgroundColor: C.primary, borderColor: C.primary },
  cbTxt: { flex: 1, fontSize: F.sm, color: C.textSec, lineHeight: 19 },

  regBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.primaryLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  regBoxTxt: { fontSize: F.sm, fontWeight: "800", color: C.primaryDark, letterSpacing: 0.5 },

  // Strength bar
  strRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: -4 },
  strTrack: { flex: 1, height: 3, borderRadius: 99, backgroundColor: C.border, overflow: "hidden" },
  strFill: { height: "100%", borderRadius: 99 },
  strLbl: { fontSize: F.xs, fontWeight: "700", minWidth: 42, textAlign: "right" },

  // Forgot
  forgotBtn: { alignSelf: "flex-end", paddingVertical: 2 },
  forgotTxt: { fontSize: F.sm, color: C.primary, fontWeight: "700" },

  // Primary button
  btn: {
    borderRadius: 12, paddingVertical: 15,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnTxt: { fontSize: F.md, fontWeight: "800", color: C.white, letterSpacing: 0.3 },

  // Alt button
  altBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.white, borderRadius: 12,
    paddingVertical: 13, borderWidth: 1, borderColor: C.border,
  },
  altBtnTxt: { fontSize: F.sm, color: C.text, fontWeight: "700" },

  // Divider
  divRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divTxt: { fontSize: F.xs, color: C.textLight },

  // Switch row
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 4 },
  switchTxt: { fontSize: F.sm, color: C.textSec },
  switchLink: { fontSize: F.sm, fontWeight: "800", color: C.primary },

  // Back btn
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    justifyContent: "center", alignItems: "center", marginBottom: 20,
  },

  // Icon block
  iconBlock: { marginBottom: 16 },
  iconCircle: {
    width: 60, height: 60, borderRadius: 18,
    justifyContent: "center", alignItems: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  headBlock: { marginBottom: 24 },
  headTitle: { fontSize: 26, fontWeight: "800", color: C.text, marginBottom: 6, letterSpacing: -0.3 },
  headSub: { fontSize: F.sm, color: C.textSec, lineHeight: 20 },

  // OTP
  otpRow: { flexDirection: "row", gap: 8 },
  otpBox: {
    flex: 1, height: 56, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.white,
    fontSize: F.xl, fontWeight: "800",
    color: C.text, textAlign: "center",
  },
  otpBoxFilled: { borderColor: C.primary, backgroundColor: C.primaryLight },
  otpBoxErr: { borderColor: C.error },

  errBox: {
    flexDirection: "row", alignItems: "center",
    gap: 6, backgroundColor: "#FFF0F0",
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    borderLeftWidth: 3, borderLeftColor: C.error,
  },
  errTxt: { fontSize: F.sm, color: C.error, fontWeight: "600" },

  successBox: {
    flexDirection: "row", alignItems: "center",
    gap: 8, backgroundColor: "#F0FDF4",
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12,
    borderLeftWidth: 3, borderLeftColor: C.success,
  },
  successTxt: { fontSize: F.sm, color: C.success, fontWeight: "600" },
});

export { s as styles };