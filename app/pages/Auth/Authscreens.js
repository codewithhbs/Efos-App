import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Animated, Dimensions, StatusBar, Keyboard,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useAuthStore from "../../store/useAuthStore";

const { width: W } = Dimensions.get("window");

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
// Strategy:
//   iOS  → behavior="padding" lifts the whole view above keyboard
//   Android → behavior="height" shrinks view; extra paddingBottom ensures
//             last fields are reachable
//   Both → TouchableWithoutFeedback dismisses keyboard on outside tap
//          ScrollView with keyboardShouldPersistTaps="handled" keeps taps working
function KBSafe({ children, bottomPad = 140 }) {
  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
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
      <View>
        <Image
          source={require("../../assets/logo.jpg")}
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />
      </View>

      <Text style={s.brandTitle}>{title}</Text>
      <Text style={s.brandSub}>{sub}</Text>
    </View>
  );
}

// ─── FIELD ────────────────────────────────────────────────────
function Field({
  icon, placeholder, value, onChangeText, error,
  secureTextEntry = false, keyboardType = "default",
  rightEl, editable = true, scrollRef, scrollY = 0,
}) {
  const [focused, setFocused] = useState(false);
  const bAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
  setFocused(true);

  Animated.timing(bAnim, {
    toValue: 1,
    duration: 180,
    useNativeDriver: false,
  }).start();

  setTimeout(() => {
    scrollRef?.current?.scrollTo?.({
      y: scrollY,
      animated: true,
    });
  }, 150);
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
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
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
            )
          }
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── SOCIAL BUTTON ────────────────────────────────────────────
function SocBtn({ icon, label }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => Animated.sequence([
    Animated.timing(scale, { toValue: 0.95, duration: 70, useNativeDriver: true }),
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
  ]).start();
  return (
    <Animated.View style={[s.socBtn, { transform: [{ scale }] }]}>
      <TouchableOpacity style={s.socBtnInner} onPress={press} activeOpacity={1}>
        <Ionicons name={icon} size={18} color={C.text} />
        <Text style={s.socBtnTxt}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── DIVIDER ──────────────────────────────────────────────────
function Div() {
  return (
    <View style={s.divRow}>
      <View style={s.divLine} />
      <Text style={s.divTxt}>or continue with</Text>
      <View style={s.divLine} />
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════
export function LoginScreen({ navigation }) {
  const [reg, setReg] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuthStore();
  const scrollRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!reg.trim()) e.reg = "Registration number required";
    if (!pass.trim()) e.pass = "Password required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    setLoading(true);
    try {
      const r = await login({ registration_number: reg.trim(), password: pass.trim() });
      if (r.success) navigation.replace("Main");
      else Alert.alert("Login Failed", r.message || "Invalid credentials");
    } catch { Alert.alert("Error", "Something went wrong."); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KBSafe bottomPad={120}>
        <View style={s.inner} ref={scrollRef}>
          <Brand title="Welcome back" sub="Sign in to continue your journey" />

          <View style={s.card}>
            <Field
              icon="id-card-outline" placeholder="Registration Number"
              keyboardType="phone-pad" value={reg}
              onChangeText={(t) => { setReg(t); if (errors.reg) setErrors({ ...errors, reg: null }); }}
              error={errors.reg}
              scrollRef={scrollRef} scrollY={0}
            />
            <Field
              icon="lock-closed-outline" placeholder="Password"
              secureTextEntry={!showPass} value={pass}
              onChangeText={(t) => { setPass(t); if (errors.pass) setErrors({ ...errors, pass: null }); }}
              error={errors.pass}
              scrollRef={scrollRef} scrollY={80}
              rightEl={
                <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={showPass ? "eye-off" : "eye"} size={17} color={C.textLight} />
                </TouchableOpacity>
              }
            />

            <TouchableOpacity style={s.forgotBtn} onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={s.forgotTxt}>Forgot password?</Text>
            </TouchableOpacity>

            <Btn label="Sign In" onPress={handleLogin} loading={loading} />


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
// SIGNUP
// ════════════════════════════════════════════════════════════
export function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pass, setPass] = useState("");
  const [passConf, setPassConf] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showPassConf, setShowPassConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuthStore();
  const scrollRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Valid email required";
    if (!phone.trim()) e.phone = "Phone required";
    if (pass.length < 8) e.pass = "Minimum 8 characters";
    if (pass !== passConf) e.passConf = "Passwords don't match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!validate()) return;
    setLoading(true);
    try {
      const r = await register({
        name: name.trim(), email: email.trim().toLowerCase(),
        phone: phone.trim(), password: pass, password_confirmation: passConf,
      });
      if (r.success) Alert.alert("Account Created!", "Please sign in.", [
        { text: "Sign In", onPress: () => navigation.replace("Login") },
      ]);
      else Alert.alert("Registration Failed", r.message || "Please try again");
    } catch { Alert.alert("Error", "Something went wrong."); }
    finally { setLoading(false); }
  };

  const sc = (y) => () => scrollRef.current?.scrollTo({ y, animated: true });

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            ref={scrollRef}
            style={s.flex}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 180 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            overScrollMode="never"
          >
            <View style={s.inner}>
              <Brand title="Create account" sub="Start your learning journey today" />

              <View style={s.card}>
                <Field
                  icon="person-outline" placeholder="Full Name" value={name}
                  onChangeText={(t) => { setName(t); if (errors.name) setErrors({ ...errors, name: null }); }}
                  error={errors.name} scrollRef={scrollRef} scrollY={0}
                />
                <Field
                  icon="mail-outline" placeholder="Email Address"
                  keyboardType="email-address" value={email}
                  onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: null }); }}
                  error={errors.email} scrollRef={scrollRef} scrollY={60}
                />
                <Field
                  icon="call-outline" placeholder="Phone Number"
                  keyboardType="phone-pad" value={phone}
                  onChangeText={(t) => { setPhone(t); if (errors.phone) setErrors({ ...errors, phone: null }); }}
                  error={errors.phone} scrollRef={scrollRef} scrollY={130}
                />
                <Field
                  icon="lock-closed-outline" placeholder="Create Password"
                  secureTextEntry={!showPass} value={pass}
                  onChangeText={(t) => { setPass(t); if (errors.pass) setErrors({ ...errors, pass: null }); }}
                  error={errors.pass} scrollRef={scrollRef} scrollY={210}
                  rightEl={
                    <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name={showPass ? "eye-off" : "eye"} size={17} color={C.textLight} />
                    </TouchableOpacity>
                  }
                />
                <StrBar password={pass} />
                <Field
                  icon="shield-checkmark-outline" placeholder="Confirm Password"
                  secureTextEntry={!showPassConf} value={passConf}
                  onChangeText={(t) => { setPassConf(t); if (errors.passConf) setErrors({ ...errors, passConf: null }); }}
                  error={errors.passConf} scrollRef={scrollRef} scrollY={300}
                  rightEl={
                    <TouchableOpacity onPress={() => setShowPassConf(!showPassConf)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name={showPassConf ? "eye-off" : "eye"} size={17} color={C.textLight} />
                    </TouchableOpacity>
                  }
                />

                <Btn label="Create Account" onPress={handleRegister} loading={loading} />

              </View>

              <View style={s.switchRow}>
                <Text style={s.switchTxt}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={s.switchLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ════════════════════════════════════════════════════════════
export function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { forgetPassword } = useAuthStore();

  const handleSend = async () => {
    Keyboard.dismiss();
    const e = {};
    if (!email.trim()) e.email = "Email required";
    if (newPass.length < 8) e.newPass = "Minimum 8 characters";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const r = await forgetPassword(email.trim(), newPass);
      if (r.success) setStep(2);
      else Alert.alert("Error", r.message || "Failed to send OTP");
    } catch { Alert.alert("Error", "Something went wrong."); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KBSafe bottomPad={100}>
        <View style={s.inner}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
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
              {step === 1 ? "Enter your email and set a new password" : `OTP sent to ${email}`}
            </Text>
          </View>

          <View style={s.card}>
            {step === 1 ? (
              <>
                <Field
                  icon="mail-outline" placeholder="Email Address"
                  keyboardType="email-address" value={email}
                  onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: null }); }}
                  error={errors.email}
                />
                <Field
                  icon="lock-closed-outline" placeholder="New Password"
                  secureTextEntry value={newPass}
                  onChangeText={(t) => { setNewPass(t); if (errors.newPass) setErrors({ ...errors, newPass: null }); }}
                  error={errors.newPass}
                />
                <StrBar password={newPass} />
                <Btn label="Send OTP" onPress={handleSend} loading={loading} />
              </>
            ) : (
              <>
                <View style={s.successBox}>
                  <Ionicons name="checkmark-circle" size={20} color={C.success} />
                  <Text style={s.successTxt}>OTP sent successfully!</Text>
                </View>
                <Btn label="Enter OTP" onPress={() => navigation.navigate("OTP", { email })} />
              </>
            )}
          </View>
        </View>
      </KBSafe>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════
// OTP
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
    if (v.length > 1) return;
    const next = [...otp]; next[i] = v; setOtp(next); setError("");
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
      if (r.success) Alert.alert("Password Reset!", "You can now sign in.", [
        { text: "Sign In", onPress: () => navigation.replace("Login") },
      ]);
      else { setError(r.message || "Invalid OTP"); shake(); }
    } catch { setError("Something went wrong."); shake(); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const r = await resendForgetPasswordOtp(email);
      if (r.success) { setOtp(["", "", "", "", "", ""]); inputs.current[0]?.focus(); }
      else Alert.alert("Error", r.message || "Failed to resend");
    } catch { Alert.alert("Error", "Something went wrong."); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KBSafe bottomPad={80}>
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
            <Text style={s.headSub}>6-digit code sent to {email}</Text>
          </View>

          <View style={s.card}>
            <Animated.View style={[s.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
              {otp.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(r) => (inputs.current[i] = r)}
                  style={[s.otpBox, d && s.otpBoxFilled, error && s.otpBoxErr]}
                  maxLength={1}
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
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },

  // Brand
  brand: { alignItems: "center", marginBottom: 28, paddingTop: 8 },
  brandLogo: {
    width: 58, height: 58, borderRadius: 16,
    justifyContent: "center", alignItems: "center",
    marginBottom: 10,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  brandLogoTxt: { fontSize: F.xl, fontWeight: "900", color: C.white },
  brandName: { fontSize: F.xs, fontWeight: "800", color: C.primary, letterSpacing: 4, marginBottom: 14 },
  brandTitle: { fontSize: 26, fontWeight: "800", color: C.text, marginBottom: 6, textAlign: "center", letterSpacing: -0.3 },
  brandSub: { fontSize: F.sm, color: C.textSec, textAlign: "center", lineHeight: 20 },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    padding: 20, gap: 12, marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },

  // Field
  fieldWrap: { gap: 4 },
  fieldBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.white, borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 11,
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: { flex: 1, fontSize: F.base, color: C.text, padding: 0 },
  fieldErr: { flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 2 },
  fieldErrTxt: { fontSize: F.xs, color: C.error },

  // Strength bar
  strRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: -4 },
  strTrack: { flex: 1, height: 3, borderRadius: 99, backgroundColor: C.border, overflow: "hidden" },
  strFill: { height: "100%", borderRadius: 99 },
  strLbl: { fontSize: F.xs, fontWeight: "700", minWidth: 42, textAlign: "right" },

  // Forgot
  forgotBtn: { alignSelf: "flex-end" },
  forgotTxt: { fontSize: F.sm, color: C.primary, fontWeight: "600" },

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

  // Divider
  divRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divTxt: { fontSize: F.xs, color: C.textLight },

  // Social
  socRow: { flexDirection: "row", gap: 10 },
  socBtn: { flex: 1 },
  socBtnInner: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    backgroundColor: C.white, borderRadius: 12,
    paddingVertical: 13, borderWidth: 1, borderColor: C.border,
  },
  socBtnTxt: { fontSize: F.sm, color: C.text, fontWeight: "600" },

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