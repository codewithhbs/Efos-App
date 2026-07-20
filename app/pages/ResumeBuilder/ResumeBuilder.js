import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

import API from "../../utils/axiosInstanct";
import useAuthStore from "../../store/useAuthStore";
const EFOS_TAGLINE = "Education Future One Stop";
export const EFOS_SITE = "efos.in";
const EFOS_LOGO_BASE64 = "https://efos.in/public/assets/images/logo/logo.jpg";
import {
    Field,
    SelectField,
    Row,
    Col,
    Section,
    C,
} from "../../components/FormFields";
import {
    STATE_OPTIONS,
    getDistrictOptions,
    AGE_GROUP_OPTIONS,
    GENDER_OPTIONS,
    QUALIFICATION_OPTIONS,
    PRESENT_STATUS_OPTIONS,
    LOOKING_FOR_OPTIONS,
    CATEGORY_OPTIONS,
    BLOOD_GROUP_OPTIONS,
    BOARD_OPTIONS,
    SCHOOL_STREAM_OPTIONS,
    GRAD_STREAM_OPTIONS,
    PG_STREAM_OPTIONS,
    SKILL_TYPE_OPTIONS,
    SKILL_TRADE_OPTIONS,
    EXPERIENCE_YEAR_OPTIONS,
    EXPERIENCE_TYPE_OPTIONS,
    PASSPORT_OPTIONS,
    RELOCATION_OPTIONS,
    YEAR_OPTIONS,
} from "../../utils/formOptions";

const STEPS = [
    { title: "Basic Information", icon: "person-outline" },
    { title: "Personal Details", icon: "people-outline" },
    { title: "Education", icon: "school-outline" },
    { title: "Skills & Career", icon: "briefcase-outline" },
];

const EMPTY = {
    name: "", phone: "", email: "", whatsapp: "",
    age_group: "", gender: "", present_status: "",
    state: "", district: "", pincode: "", address: "",

    father_name: "", mother_name: "", category: "",
    blood_group: "", profile_summary: "",

    highest_qualification: "",
    tenth_board: "", tenth_year: "", tenth_marks: "", tenth_stream: "",
    twelfth_board: "", twelfth_year: "", twelfth_marks: "", twelfth_stream: "",
    graduation_university: "", graduation_year: "", graduation_marks: "",
    graduation_stream: "", graduation_field: "",
    pg_university: "", pg_year: "", pg_marks: "", pg_stream: "", pg_field: "",

    skill_type: "", skill_trade: "", skill_year: "",
    looking_for: "", experience_type: "", passport: "", relocation: "",
};

// ─── Qualification-based education gating ─────────────────────
const eduFlags = (qual) => {
    const gradPlus = ["Graduate", "Post Graduate", "PhD"].includes(qual);
    const ugPlus = qual === "Undergraduate" || gradPlus;
    return {
        tenth: !!qual && qual !== "Below 10th",
        twelfth: qual === "12th Pass" || ugPlus,
        grad: ugPlus,
        gradRequired: gradPlus,
        pg: ["Post Graduate", "PhD"].includes(qual),
    };
};

const eduRequired = (qual) => {
    const f = eduFlags(qual);
    const keys = ["highest_qualification"];
    if (f.tenth) keys.push("tenth_board", "tenth_year", "tenth_marks");
    if (f.twelfth) keys.push("twelfth_board", "twelfth_year", "twelfth_marks");
    if (f.gradRequired)
        keys.push("graduation_university", "graduation_year", "graduation_marks", "graduation_stream");
    if (f.pg) keys.push("pg_university", "pg_year", "pg_marks", "pg_stream");
    return keys;
};

// static required — step 2 dynamic hai, isliye null
const REQUIRED = [
    ["name", "phone", "email", "whatsapp", "age_group", "gender", "present_status", "state", "district", "pincode", "address"],
    ["father_name", "mother_name", "category", "blood_group", "profile_summary"],
    null, // education → eduRequired()
    ["skill_type", "skill_trade", "skill_year", "looking_for", "experience_type", "passport", "relocation"],
];

const EMPTY_EXP = {
    company_name: "", job_profile: "", job_duration: "",
    job_state: "", job_district: "", salary_range: "", job_summary: "",
};

const requiredFor = (stepIdx, qual) =>
    stepIdx === 2 ? eduRequired(qual) : REQUIRED[stepIdx];

const esc = (v) =>
    String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

// ══════════════════════════════════════════════════════════════
export default function ResumeBuilder({ navigation }) {
    const { student, fetchProfile } = useAuthStore();

    const [step, setStep] = useState(0);
    const [form, setForm] = useState(EMPTY);
    const [photo, setPhoto] = useState(null);
    const [errors, setErrors] = useState({});
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [experiences, setExperiences] = useState([]);
    const isExp = (t) => !!t && t !== "Fresher";
    useEffect(() => { fetchProfile(); }, []);
    // console.log(student)
    useEffect(() => {
        if (student) {
            setForm((prev) => {
                const merged = { ...prev };
                Object.keys(EMPTY).forEach((k) => {
                    if (student[k] != null && student[k] !== "") merged[k] = String(student[k]);
                });
                return merged;
            });
            let ex = student.experiences;
            if (typeof ex === "string") { try { ex = JSON.parse(ex); } catch { ex = []; } }
            if (Array.isArray(ex) && ex.length)
                setExperiences(ex.map((e) => ({ ...EMPTY_EXP, ...e })));

        }
    }, [student]);

    const districtOptions = useMemo(
        () => getDistrictOptions(form.state),
        [form.state]
    );

    // qualification-aware completion check
    const stepStatus = useMemo(
        () =>
            STEPS.map((_, i) =>
                requiredFor(i, student?.highest_qualification).every(
                    (k) => !!student?.[k]
                )
            ),
        [student]
    );

    const isComplete = useMemo(() => stepStatus.every(Boolean), [stepStatus]);

    const set = useCallback((key, value) => {
        setForm((f) => {
            if (key === "state") return { ...f, state: value, district: "" };
            return { ...f, [key]: value };
        });
        // qualification badla → purane edu errors stale, sab clear
        if (key === "highest_qualification") setErrors({});
        else setErrors((e) => (e[key] ? { ...e, [key]: null } : e));
    }, []);

    // ─── Photo ────────────────────────────────────────────────
    const pickImage = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
            aspect: [1, 1],
        });

        if (!res.canceled) setPhoto(res.assets[0]);
    };

    // ─── Validation ───────────────────────────────────────────
    const validateStep = () => {
        const e = {};

        requiredFor(step, form.highest_qualification).forEach((k) => {
            if (!String(form[k] || "").trim()) e[k] = "Required";
        });

        if (step === 0) {
            if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
            if (form.phone && !/^\d{10}$/.test(form.phone)) e.phone = "10-digit phone required";
            if (form.pincode && !/^\d{6}$/.test(form.pincode)) e.pincode = "6-digit pincode";
        }

        setErrors(e);

        if (Object.keys(e).length) {
            Alert.alert("Incomplete", "Please fill all required fields on this step.");
            return false;
        }

        return true;
    };
    const addExp = () => setExperiences((e) => [...e, { ...EMPTY_EXP }]);
    const removeExp = (i) => setExperiences((e) => e.filter((_, idx) => idx !== i));
    const setExp = (i, k, v) =>
        setExperiences((e) => e.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));

    // auto-add first row when experienced chosen
    useEffect(() => {
        if (isExp(form.experience_type) && experiences.length === 0)
            setExperiences([{ ...EMPTY_EXP }]);
    }, [form.experience_type]);

    const next = () => {
        if (!validateStep()) return;
        if (step < STEPS.length - 1) setStep(step + 1);
    };

    const prev = () => step > 0 && setStep(step - 1);

    // ─── Save ─────────────────────────────────────────────────
    const submitProfile = async () => {
        if (!validateStep()) return;

        setLoading(true);
        try {
            const fd = new FormData();

            const f = eduFlags(form.highest_qualification);

            Object.entries(form).forEach(([k, v]) => {
                // hidden edu sections ki values server pe mat bhejo
                if (!f.tenth && k.startsWith("tenth_")) return;
                if (!f.twelfth && k.startsWith("twelfth_")) return;
                if (!f.grad && k.startsWith("graduation_")) return;
                if (!f.pg && k.startsWith("pg_")) return;
                if (v !== "" && v != null) fd.append(k, String(v));
            });

            if (isExp(form.experience_type)) {
                const clean = experiences.filter(
                    (e) => e.company_name?.trim() || e.job_profile?.trim()
                );
                fd.append("experiences", JSON.stringify(clean));
            }
            if (photo) {
                fd.append("photo", {
                    uri: photo.uri,
                    name: "profile.jpg",
                    type: "image/jpeg",
                });
            }

            const res = await API.post("/auth/update-student-profile", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data?.success) {
                await fetchProfile();
                setEditMode(false);

                Alert.alert("Saved", "Your resume details have been saved.", [
                    { text: "OK" },
                ]);
            } else {
                Alert.alert("Error", res.data?.message || "Something went wrong");
            }
        } catch (err) {
            console.error("[submitProfile]", err?.response?.data || err?.message);
            Alert.alert("Error", "Failed to save. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ─── PDF ──────────────────────────────────────────────────
    const buildHtml = () => {
        const f = form;
        const flags = eduFlags(f.highest_qualification);

        const row = (label, val) =>
            val
                ? `<tr><td class="lbl">${esc(label)}</td><td class="val">${esc(val)}</td></tr>`
                : "";

        const eduBlock = (title, sub, year, marks, stream) =>
            title
                ? `<div class="item">
             <div class="item-top">
               <span class="item-title">${esc(title)}</span>
               <span class="item-year">${esc(year || "")}</span>
             </div>
             <div class="item-sub">${esc(sub || "")}</div>
             <div class="item-meta">
               ${marks ? `<span class="pill">${esc(marks)}%</span>` : ""}
               ${stream ? `<span class="pill">${esc(stream)}</span>` : ""}
             </div>
           </div>`
                : "";

        const location = [f.address, f.district, f.state].filter(Boolean).join(", ");

      
        const expList = experiences.filter((e) => e.company_name?.trim() || e.job_profile?.trim());
        const expHtml = expList
            .map((e) => {
                const place = [e.job_district, e.job_state].filter(Boolean).join(", ");
                return `<div class="item">
              <div class="item-top">
                <span class="item-title">${esc(e.job_profile || "Role")}</span>
                <span class="item-year">${esc(e.job_duration || "")}</span>
              </div>
              <div class="item-sub">
                ${e.company_name ? `<b>${esc(e.company_name)}</b>` : ""}${place ? ` &middot; ${esc(place)}` : ""}
              </div>
              <div class="item-meta">
                ${e.salary_range ? `<span class="pill">${esc(e.salary_range)}</span>` : ""}
              </div>
              ${e.job_summary ? `<div class="item-desc">${esc(e.job_summary)}</div>` : ""}
            </div>`;
            })
            .join("");

        const eduHtml = [
            flags.pg && f.pg_university
                ? eduBlock(f.pg_field || "Post Graduation", f.pg_university, f.pg_year, f.pg_marks, f.pg_stream)
                : "",
            flags.grad && f.graduation_university
                ? eduBlock(f.graduation_field || "Graduation", f.graduation_university, f.graduation_year, f.graduation_marks, f.graduation_stream)
                : "",
            flags.twelfth && f.twelfth_board
                ? eduBlock("Class 12th", f.twelfth_board, f.twelfth_year, f.twelfth_marks, f.twelfth_stream)
                : "",
            flags.tenth && f.tenth_board
                ? eduBlock("Class 10th", f.tenth_board, f.tenth_year, f.tenth_marks, f.tenth_stream)
                : "",
        ].join("");

        // fallback summary jab profile_summary blank ho
        const autoSummary = (() => {
            const bits = [];
            if (f.skill_trade) bits.push(esc(f.skill_trade));
            if (f.experience_type) bits.push(esc(f.experience_type.toLowerCase()));
            const head = bits.length ? bits.join(" professional, ") : "Motivated candidate";
            const yrs = f.skill_year ? ` with ${esc(f.skill_year)} years of hands-on experience` : "";
            const loc = f.district ? ` based in ${esc(f.district)}` : "";
            const seek = f.looking_for ? ` Actively looking for ${esc(f.looking_for)} opportunities.` : "";
            return `${head.charAt(0).toUpperCase() + head.slice(1)}${yrs}${loc}.${seek}`;
        })();

        const summaryText = f.profile_summary?.trim() ? esc(f.profile_summary) : autoSummary;

        // key highlight chips
        const chips = [
            f.skill_year ? `${esc(f.skill_year)} yr Exp` : "",
            f.experience_type ? esc(f.experience_type) : "",
            f.looking_for ? esc(f.looking_for) : "",
            f.relocation ? `Relocate: ${esc(f.relocation)}` : "",
            f.passport ? `Passport: ${esc(f.passport)}` : "",
        ].filter(Boolean);

        return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Helvetica, Arial, sans-serif;
    color: #1f2937;
    font-size: 12px;
    line-height: 1.6;
  }

  /* Brand bar */
  .brandbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 34px;
    border-bottom: 4px solid #E53935;
  }
  .brandbar img { height: 44px; }
  .brand-right { text-align: right; font-size: 10px; color: #6b7280; line-height: 1.5; }
  .brand-right b { color: #E53935; font-size: 11px; letter-spacing: .5px; }

  /* Hero */
.hero {
  padding: 22px 34px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.hero-info { flex: 1; }
.hero-photo { flex-shrink: 0; }
.avatar {
  width: 88px; height: 88px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #E53935;
  display: block;
}
  .avatar {
    width: 88px; height: 88px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #E53935;
    flex-shrink: 0;
  }
  .hero h1 { font-size: 25px; letter-spacing: -.3px; color: #0f172a; margin-bottom: 3px; }
  .hero .role { font-size: 13px; color: #E53935; font-weight: bold; margin-bottom: 7px; text-transform: uppercase; letter-spacing: .5px; }
  .hero .contact { font-size: 11px; color: #4b5563; }
  .hero .contact span { margin-right: 14px; white-space: nowrap; }

  /* Chips strip */
  .chips { padding: 0 34px 6px; display: flex; flex-wrap: wrap; gap: 6px; }
  .chip {
    background: #FFF1F1;
    color: #B71C1C;
    border: 1px solid #f3c9cc;
    border-radius: 6px;
    padding: 3px 10px;
    font-size: 10px;
    font-weight: bold;
  }

  .wrap { padding: 14px 34px 30px; }

  /* Two-column body */
  .cols { display: flex; gap: 30px; }
  .main-col { flex: 1.7; }
  .side-col { flex: 1; }

  .sec { margin-top: 18px; page-break-inside: avoid; }
  .sec:first-child { margin-top: 0; }
  .sec-title {
    font-size: 10.5px;
    font-weight: bold;
    color: #E53935;
    text-transform: uppercase;
    letter-spacing: 1.4px;
    padding-bottom: 5px;
    border-bottom: 1.5px solid #f1d3d3;
    margin-bottom: 10px;
  }

  .summary { font-size: 12px; color: #374151; text-align: justify; }

  /* Items (edu + experience) */
  .item { padding: 8px 0; border-bottom: 1px dashed #e5e7eb; }
  .item:last-child { border-bottom: 0; }
  .item-top { display: flex; justify-content: space-between; align-items: baseline; }
  .item-title { font-weight: bold; font-size: 12.5px; color: #111827; }
  .item-year { font-size: 10.5px; color: #6b7280; white-space: nowrap; }
  .item-sub { font-size: 11px; color: #4b5563; margin-top: 1px; }
  .item-sub b { color: #111827; }
  .item-meta { margin-top: 5px; }
  .item-desc { font-size: 10.5px; color: #4b5563; margin-top: 4px; text-align: justify; }

  .pill {
    display: inline-block;
    background: #FFEBEE;
    color: #B71C1C;
    border: 1px solid #f3c9cc;
    border-radius: 20px;
    padding: 2px 9px;
    font-size: 9.5px;
    font-weight: bold;
    margin-right: 5px;
  }

  /* Side tables */
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 0; vertical-align: top; font-size: 11px; }
  .lbl { color: #6b7280; width: 46%; font-weight: 600; }
  .val { color: #111827; font-weight: bold; }

  .footer {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1.5px solid #f1f1f4;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 9.5px;
    color: #9ca3af;
  }
  .footer b { color: #E53935; }
</style>
</head>
<body>

  <div class="brandbar">
    <img src="${EFOS_LOGO_BASE64}" alt="EFOS" />
    <div class="brand-right">
      <b>${esc(EFOS_TAGLINE.toUpperCase())}</b><br />
      Associate with &middot; ${esc(EFOS_SITE)}
    </div>
  </div>
<div class="hero">
  <div class="hero-info">
    <h1>${esc(f.name || "Candidate Name")}</h1>
    <div class="role">${esc(f.skill_trade || f.highest_qualification || "Job Seeker")}</div>
    <div class="contact">
      ${f.phone ? `<span>&#9742; ${esc(f.phone)}</span>` : ""}
      ${f.email ? `<span>&#9993; ${esc(f.email)}</span>` : ""}
      ${f.whatsapp ? `<span>&#128172; ${esc(f.whatsapp)}</span>` : ""}
    </div>
    ${location ? `<div class="contact" style="margin-top:3px">&#9906; ${esc(location)}${f.pincode ? " - " + esc(f.pincode) : ""}</div>` : ""}
  </div>
  <div class="hero-photo">
    ${(() => {
      const avatarUri = photo?.uri || (student?.photo ? `https://api.epinfoways.com/${student.photo}` : "");
      return avatarUri ? `<img class="avatar" src="${avatarUri}" />` : "";
    })()}
  </div>
</div>
  ${chips.length ? `<div class="chips">${chips.map((c) => `<span class="chip">${c}</span>`).join("")}</div>` : ""}

  <div class="wrap">
    <div class="cols">

      <!-- LEFT / MAIN -->
      <div class="main-col">

        <div class="sec">
          <div class="sec-title">Profile Summary</div>
          <div class="summary">${summaryText}</div>
        </div>

        ${expHtml ? `
        <div class="sec">
          <div class="sec-title">Work Experience</div>
          ${expHtml}
        </div>` : ""}

        ${eduHtml ? `
        <div class="sec">
          <div class="sec-title">Education</div>
          ${eduHtml}
        </div>` : ""}

      </div>

      <!-- RIGHT / SIDE -->
      <div class="side-col">

        <div class="sec">
          <div class="sec-title">Skills &amp; Career</div>
          <table>
            ${row("Skill Type", f.skill_type)}
            ${row("Skill / Trade", f.skill_trade)}
            ${row("Experience", f.skill_year ? `${f.skill_year} Years` : "")}
            ${row("Exp. Type", f.experience_type)}
            ${row("Looking For", f.looking_for)}
            ${row("Present Status", f.present_status)}
          </table>
        </div>

        <div class="sec">
          <div class="sec-title">Personal</div>
          <table>
            ${row("Father", f.father_name)}
            ${row("Mother", f.mother_name)}
            ${row("Gender", f.gender)}
            ${row("Age Group", f.age_group?.replace("_", " - "))}
            ${row("Category", f.category)}
            ${row("Blood Group", f.blood_group)}
            ${row("Passport", f.passport)}
            ${row("Relocation", f.relocation)}
          </table>
        </div>

      </div>
    </div>

    <div class="footer">
      <span>Generated via <b>EFOS</b> &mdash; ${esc(EFOS_TAGLINE)}</span>
      <span>${new Date().toLocaleDateString("en-IN")}</span>
    </div>
  </div>
</body>
            
</html>`;
    };
    const generatePDF = async () => {
        setGenerating(true);

        try {
            const { uri } = await Print.printToFileAsync({
                html: buildHtml(),
                base64: false,
            });

            const fileName = `EFOS_Resume_${(form.name || "Candidate").replace(/\s+/g, "_")}.pdf`;
            const dest = `${FileSystem.cacheDirectory}${fileName}`;

            await FileSystem.copyAsync({ from: uri, to: dest });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(dest, {
                    mimeType: "application/pdf",
                    dialogTitle: `${form.name || "Candidate"} — Resume`,
                    UTI: "com.adobe.pdf",
                });
            } else {
                Alert.alert("Saved", "Resume PDF generated successfully.");
            }
        } catch (err) {
            console.error("[generatePDF]", err);
            Alert.alert("Error", "Failed to generate PDF. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    // ─── Step content ─────────────────────────────────────────
    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <>
                        <PhotoPicker
                            photo={photo}
                            existing={student?.photo}
                            onPress={pickImage}
                        />

                        <Field label="Full Name" required icon="person-outline" autoCapitalize="words"
                            placeholder="Enter full name"
                            value={form.name} onChangeText={(v) => set("name", v)} error={errors.name} />

                        <Row>
                            <Col>
                                <Field label="Phone" required icon="call-outline" keyboardType="phone-pad" maxLength={10}
                                    placeholder="10-digit"
                                    value={form.phone} onChangeText={(v) => set("phone", v.replace(/\D/g, ""))} error={errors.phone} />
                            </Col>
                            <Col>
                                <Field label="WhatsApp" required icon="logo-whatsapp" keyboardType="phone-pad" maxLength={10}
                                    placeholder="10-digit"
                                    value={form.whatsapp} onChangeText={(v) => set("whatsapp", v.replace(/\D/g, ""))} error={errors.whatsapp} />
                            </Col>
                        </Row>

                        <Field label="Email Address" required icon="mail-outline" keyboardType="email-address"
                            placeholder="you@example.com"
                            value={form.email} onChangeText={(v) => set("email", v)} error={errors.email} />

                        <Row>
                            <Col>
                                <SelectField label="Age Group" required icon="calendar-outline"
                                    value={form.age_group} onValueChange={(v) => set("age_group", v)}
                                    options={AGE_GROUP_OPTIONS} error={errors.age_group} />
                            </Col>
                            <Col>
                                <SelectField label="Gender" required icon="male-female-outline"
                                    value={form.gender} onValueChange={(v) => set("gender", v)}
                                    options={GENDER_OPTIONS} error={errors.gender} />
                            </Col>
                        </Row>

                        <SelectField label="Present Status" required icon="pulse-outline"
                            value={form.present_status} onValueChange={(v) => set("present_status", v)}
                            options={PRESENT_STATUS_OPTIONS} error={errors.present_status} />

                        <Row>
                            <Col>
                                <SelectField label="State" required icon="map-outline" searchable
                                    placeholder="Select State"
                                    value={form.state} onValueChange={(v) => set("state", v)}
                                    options={STATE_OPTIONS} error={errors.state} />
                            </Col>
                            <Col>
                                <SelectField label="District" required icon="location-outline" searchable
                                    placeholder={form.state ? "Select District" : "Pick state first"}
                                    value={form.district} onValueChange={(v) => set("district", v)}
                                    options={districtOptions} disabled={!form.state} error={errors.district} />
                            </Col>
                        </Row>

                        <Field label="Pincode" required icon="navigate-outline" keyboardType="numeric" maxLength={6}
                            placeholder="6-digit pincode"
                            value={form.pincode} onChangeText={(v) => set("pincode", v.replace(/\D/g, ""))} error={errors.pincode} />

                        <Field label="Full Address" required icon="home-outline" multiline
                            placeholder="House no, street, locality"
                            value={form.address} onChangeText={(v) => set("address", v)} error={errors.address} />
                    </>
                );

            case 1:
                return (
                    <>
                        <Row>
                            <Col>
                                <Field label="Father's Name" required icon="man-outline" autoCapitalize="words"
                                    placeholder="Enter name"
                                    value={form.father_name} onChangeText={(v) => set("father_name", v)} error={errors.father_name} />
                            </Col>
                            <Col>
                                <Field label="Mother's Name" required icon="woman-outline" autoCapitalize="words"
                                    placeholder="Enter name"
                                    value={form.mother_name} onChangeText={(v) => set("mother_name", v)} error={errors.mother_name} />
                            </Col>
                        </Row>

                        <Row>
                            <Col>
                                <SelectField label="Category" required icon="people-outline"
                                    value={form.category} onValueChange={(v) => set("category", v)}
                                    options={CATEGORY_OPTIONS} error={errors.category} />
                            </Col>
                            <Col>
                                <SelectField label="Blood Group" required icon="water-outline"
                                    value={form.blood_group} onValueChange={(v) => set("blood_group", v)}
                                    options={BLOOD_GROUP_OPTIONS} error={errors.blood_group} />
                            </Col>
                        </Row>

                        <Field label="Profile Summary" required icon="document-text-outline" multiline
                            placeholder="2-3 lines about yourself, your strengths and goals..."
                            value={form.profile_summary} onChangeText={(v) => set("profile_summary", v)}
                            error={errors.profile_summary} />
                    </>
                );

            case 2: {
                const f = eduFlags(form.highest_qualification);
                return (
                    <>
                        <SelectField label="Highest Qualification" required icon="ribbon-outline"
                            value={form.highest_qualification} onValueChange={(v) => set("highest_qualification", v)}
                            options={QUALIFICATION_OPTIONS} error={errors.highest_qualification} />

                        {!form.highest_qualification && (
                            <Text style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 8 }}>
                                Select qualification to see relevant sections
                            </Text>
                        )}

                        {f.tenth && (
                            <>
                                <Section title="CLASS 10TH" />
                                <Row>
                                    <Col>
                                        <SelectField label="Board" required icon="library-outline" searchable
                                            value={form.tenth_board} onValueChange={(v) => set("tenth_board", v)}
                                            options={BOARD_OPTIONS} error={errors.tenth_board} />
                                    </Col>
                                    <Col>
                                        <SelectField label="Year" required icon="calendar-outline" searchable
                                            value={form.tenth_year} onValueChange={(v) => set("tenth_year", v)}
                                            options={YEAR_OPTIONS} error={errors.tenth_year} />
                                    </Col>
                                </Row>
                                <Field label="Marks (%)" required icon="stats-chart-outline" keyboardType="numeric" maxLength={5}
                                    placeholder="e.g. 78"
                                    value={form.tenth_marks} onChangeText={(v) => set("tenth_marks", v)} error={errors.tenth_marks} />
                            </>
                        )}

                        {f.twelfth && (
                            <>
                                <Section title="CLASS 12TH" />
                                <Row>
                                    <Col>
                                        <SelectField label="Board" required icon="library-outline" searchable
                                            value={form.twelfth_board} onValueChange={(v) => set("twelfth_board", v)}
                                            options={BOARD_OPTIONS} error={errors.twelfth_board} />
                                    </Col>
                                    <Col>
                                        <SelectField label="Year" required icon="calendar-outline" searchable
                                            value={form.twelfth_year} onValueChange={(v) => set("twelfth_year", v)}
                                            options={YEAR_OPTIONS} error={errors.twelfth_year} />
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <Field label="Marks (%)" required icon="stats-chart-outline" keyboardType="numeric" maxLength={5}
                                            placeholder="e.g. 82"
                                            value={form.twelfth_marks} onChangeText={(v) => set("twelfth_marks", v)} error={errors.twelfth_marks} />
                                    </Col>
                                    <Col>
                                        <SelectField label="Stream" icon="git-branch-outline"
                                            value={form.twelfth_stream} onValueChange={(v) => set("twelfth_stream", v)}
                                            options={SCHOOL_STREAM_OPTIONS} />
                                    </Col>
                                </Row>
                            </>
                        )}

                        {f.grad && (
                            <>
                                <Section title={f.gradRequired ? "GRADUATION" : "GRADUATION (PURSUING — OPTIONAL)"} />
                                <Field label="University / College" required={f.gradRequired} icon="business-outline" autoCapitalize="words"
                                    placeholder="Enter institute name"
                                    value={form.graduation_university} onChangeText={(v) => set("graduation_university", v)}
                                    error={errors.graduation_university} />
                                <Row>
                                    <Col>
                                        <SelectField label="Year" required={f.gradRequired} icon="calendar-outline" searchable
                                            value={form.graduation_year} onValueChange={(v) => set("graduation_year", v)}
                                            options={YEAR_OPTIONS} error={errors.graduation_year} />
                                    </Col>
                                    <Col>
                                        <Field label="Marks / CGPA" required={f.gradRequired} icon="stats-chart-outline"
                                            placeholder="e.g. 7.8"
                                            value={form.graduation_marks} onChangeText={(v) => set("graduation_marks", v)}
                                            error={errors.graduation_marks} />
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <SelectField label="Stream" required={f.gradRequired} icon="git-branch-outline" searchable
                                            value={form.graduation_stream} onValueChange={(v) => set("graduation_stream", v)}
                                            options={GRAD_STREAM_OPTIONS} error={errors.graduation_stream} />
                                    </Col>
                                    <Col>
                                        <Field label="Specialization" icon="bookmark-outline"
                                            placeholder="e.g. CSE"
                                            value={form.graduation_field} onChangeText={(v) => set("graduation_field", v)} />
                                    </Col>
                                </Row>
                            </>
                        )}

                        {f.pg && (
                            <>
                                <Section title="POST GRADUATION" />
                                <Field label="University / College" required icon="business-outline" autoCapitalize="words"
                                    placeholder="Enter institute name"
                                    value={form.pg_university} onChangeText={(v) => set("pg_university", v)}
                                    error={errors.pg_university} />
                                <Row>
                                    <Col>
                                        <SelectField label="Year" required icon="calendar-outline" searchable
                                            value={form.pg_year} onValueChange={(v) => set("pg_year", v)}
                                            options={YEAR_OPTIONS} error={errors.pg_year} />
                                    </Col>
                                    <Col>
                                        <Field label="Marks / CGPA" required icon="stats-chart-outline"
                                            placeholder="e.g. 8.1"
                                            value={form.pg_marks} onChangeText={(v) => set("pg_marks", v)}
                                            error={errors.pg_marks} />
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <SelectField label="Stream" required icon="git-branch-outline" searchable
                                            value={form.pg_stream} onValueChange={(v) => set("pg_stream", v)}
                                            options={PG_STREAM_OPTIONS} error={errors.pg_stream} />
                                    </Col>
                                    <Col>
                                        <Field label="Specialization" icon="bookmark-outline"
                                            placeholder="e.g. Finance"
                                            value={form.pg_field} onChangeText={(v) => set("pg_field", v)} />
                                    </Col>
                                </Row>
                            </>
                        )}
                    </>
                );
            }

            case 3:
                return (
                    <>
                        <Row>
                            <Col>
                                <SelectField label="Skill Type" required icon="construct-outline"
                                    value={form.skill_type} onValueChange={(v) => set("skill_type", v)}
                                    options={SKILL_TYPE_OPTIONS} error={errors.skill_type} />
                            </Col>
                            <Col>
                                <SelectField label="SKill year" required icon="hourglass-outline"
                                    value={form.skill_year} onValueChange={(v) => set("skill_year", v)}
                                    options={EXPERIENCE_YEAR_OPTIONS} error={errors.skill_year} />
                            </Col>
                        </Row>

                        <SelectField label="Skill / Trade" required icon="hammer-outline" searchable
                            value={form.skill_trade} onValueChange={(v) => set("skill_trade", v)}
                            options={SKILL_TRADE_OPTIONS} error={errors.skill_trade} />

                        <Row>
                            <Col>
                                <SelectField label="Experience Type" required icon="time-outline"
                                    value={form.experience_type} onValueChange={(v) => set("experience_type", v)}
                                    options={EXPERIENCE_TYPE_OPTIONS} error={errors.experience_type} />
                            </Col>
                            <Col>
                                <SelectField label="Looking For" required icon="compass-outline"
                                    value={form.looking_for} onValueChange={(v) => set("looking_for", v)}
                                    options={LOOKING_FOR_OPTIONS} error={errors.looking_for} />
                            </Col>
                        </Row>

                        {isExp(form.experience_type) && (
                            <>
                                <Section title="WORK EXPERIENCE" />
                                {experiences.map((ex, i) => {
                                    const dOpts = getDistrictOptions(ex.job_state);
                                    return (
                                        <View key={i} style={s.expCard}>
                                            <View style={s.expHead}>
                                                <Text style={s.expHeadTxt}>Experience {i + 1}</Text>
                                                {experiences.length > 1 && (
                                                    <TouchableOpacity onPress={() => removeExp(i)} hitSlop={8}>
                                                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            <Field label="Company Name" icon="business-outline" autoCapitalize="words"
                                                placeholder="Enter company"
                                                value={ex.company_name} onChangeText={(v) => setExp(i, "company_name", v)} />

                                            <Row>
                                                <Col>
                                                    <Field label="Job Profile" icon="briefcase-outline"
                                                        placeholder="e.g. Electrician"
                                                        value={ex.job_profile} onChangeText={(v) => setExp(i, "job_profile", v)} />
                                                </Col>
                                                <Col>
                                                    <Field label="Duration" icon="time-outline"
                                                        placeholder="e.g. 2 Years"
                                                        value={ex.job_duration} onChangeText={(v) => setExp(i, "job_duration", v)} />
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col>
                                                    <SelectField label="State" icon="map-outline" searchable
                                                        placeholder="Select State"
                                                        value={ex.job_state}
                                                        onValueChange={(v) => { setExp(i, "job_state", v); setExp(i, "job_district", ""); }}
                                                        options={STATE_OPTIONS} />
                                                </Col>
                                                <Col>
                                                    <SelectField label="District" icon="location-outline" searchable
                                                        placeholder={ex.job_state ? "Select District" : "Pick state first"}
                                                        value={ex.job_district}
                                                        onValueChange={(v) => setExp(i, "job_district", v)}
                                                        options={dOpts} disabled={!ex.job_state} />
                                                </Col>
                                            </Row>

                                            <Field label="Salary Range" icon="cash-outline"
                                                placeholder="e.g. 15k - 20k"
                                                value={ex.salary_range} onChangeText={(v) => setExp(i, "salary_range", v)} />

                                            <Field label="Job Summary" icon="document-text-outline" multiline
                                                placeholder="Role, responsibilities..."
                                                value={ex.job_summary} onChangeText={(v) => setExp(i, "job_summary", v)} />
                                        </View>
                                    );
                                })}

                                <TouchableOpacity style={s.addExpBtn} onPress={addExp} activeOpacity={0.85}>
                                    <Ionicons name="add-circle-outline" size={18} color={C.primary} />
                                    <Text style={s.addExpTxt}>Add Another Experience</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        <Row>
                            <Col>
                                <SelectField label="Passport" required icon="airplane-outline"
                                    value={form.passport} onValueChange={(v) => set("passport", v)}
                                    options={PASSPORT_OPTIONS} error={errors.passport} />
                            </Col>
                            <Col>
                                <SelectField label="Relocation" required icon="swap-horizontal-outline"
                                    value={form.relocation} onValueChange={(v) => set("relocation", v)}
                                    options={RELOCATION_OPTIONS} error={errors.relocation} />
                            </Col>
                        </Row>
                    </>
                );

            default:
                return null;
        }
    };

    // ─── Overview (profile already complete) ──────────────────
    if (isComplete && !editMode) {
        return (
            <Overview
                student={student}
                stepStatus={stepStatus}
                generating={generating}
                onEdit={() => { setEditMode(true); setStep(0); }}
                onDownload={generatePDF}
                onBack={() => navigation.goBack()}
            />
        );
    }

    const progress = ((step + 1) / STEPS.length) * 100;
    const isLast = step === STEPS.length - 1;

    return (
        <SafeAreaView style={s.root} edges={["top"]}>
            <StatusBar barStyle={"dark-content"} />

            <LinearGradient colors={[C.primary, C.primaryDark]} style={s.header}>
                <View style={s.headRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headTitle}>Resume Builder</Text>
                    <View style={{ width: 22 }} />
                </View>

                <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${progress}%` }]} />
                </View>

                <View style={s.stepRow}>
                    <Ionicons name={STEPS[step].icon} size={13} color="rgba(255,255,255,0.9)" />
                    <Text style={s.stepTxt}>
                        {STEPS[step].title} · Step {step + 1}/{STEPS.length}
                    </Text>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : StatusBar.currentHeight || 0}
            >
                <ScrollView
                    contentContainerStyle={s.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {renderStep()}
                    <View style={{ height: 20 }} />
                </ScrollView>

                <View style={s.bottomBar}>
                    <TouchableOpacity
                        style={[s.backBtn, step === 0 && { opacity: 0.4 }]}
                        onPress={prev}
                        disabled={step === 0}
                    >
                        <Ionicons name="chevron-back" size={18} color={C.text} />
                        <Text style={s.backTxt}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={s.mainBtn}
                        onPress={isLast ? submitProfile : next}
                        disabled={loading}
                        activeOpacity={0.9}
                    >
                        <LinearGradient colors={[C.primary, C.primaryDark]} style={s.mainGrad}>
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Text style={s.mainTxt}>{isLast ? "Save & Finish" : "Continue"}</Text>
                                    <Ionicons
                                        name={isLast ? "checkmark" : "arrow-forward"}
                                        size={17}
                                        color="#fff"
                                    />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── Photo picker ─────────────────────────────────────────────
function PhotoPicker({ photo, existing, onPress }) {
    const uri = photo?.uri || (existing ? `https://api.epinfoways.com/${existing}` : null);

    return (
        <TouchableOpacity style={s.photoWrap} onPress={onPress} activeOpacity={0.85}>
            {uri ? (
                <>
                    <Image source={{ uri }} style={s.photo} />
                    <View style={s.photoEdit}>
                        <Ionicons name="camera" size={13} color="#fff" />
                    </View>
                </>
            ) : (
                <View style={s.photoEmpty}>
                    <Ionicons name="camera-outline" size={26} color={C.primary} />
                    <Text style={s.photoTxt}>Add Photo</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

// ─── Overview screen ──────────────────────────────────────────
function Overview({ student, stepStatus, generating, onEdit, onDownload, onBack }) {
    const rows = [
        ["Name", student?.name],
        ["Phone", student?.phone],
        ["Email", student?.email],
        ["Location", [student?.district, student?.state].filter(Boolean).join(", ")],
        ["Qualification", student?.highest_qualification],
        ["Skill / Trade", student?.skill_trade],
        ["Experience", student?.skill_year ? `${student.skill_year} yrs` : null],
        ["Looking For", student?.looking_for],
    ].filter(([, v]) => !!v);

    return (
        <SafeAreaView style={s.root} edges={["top"]}>
            <StatusBar barStyle={"dark-content"} />

            <LinearGradient colors={[C.primary, C.primaryDark]} style={s.header}>
                <View style={s.headRow}>
                    <TouchableOpacity onPress={onBack} hitSlop={10}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={s.headTitle}>My Resume</Text>
                    <View style={{ width: 22 }} />
                </View>

                <View style={s.readyBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#fff" />
                    <Text style={s.readyTxt}>Profile Complete · Ready to Download</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <Section title="SECTION STATUS" />

                {STEPS.map((st, i) => (
                    <View key={i} style={s.statusRow}>
                        <View style={[s.statusIcon, { backgroundColor: stepStatus[i] ? "#D1FAE5" : "#FEE2E2" }]}>
                            <Ionicons
                                name={stepStatus[i] ? "checkmark" : "alert"}
                                size={14}
                                color={stepStatus[i] ? "#059669" : "#DC2626"}
                            />
                        </View>
                        <Text style={s.statusTxt}>{st.title}</Text>
                        <Text style={[s.statusTag, { color: stepStatus[i] ? "#059669" : "#DC2626" }]}>
                            {stepStatus[i] ? "Complete" : "Incomplete"}
                        </Text>
                    </View>
                ))}

                <Section title="SAVED DETAILS" />

                <View style={s.detailCard}>
                    {rows.map(([k, v], i) => (
                        <View
                            key={k}
                            style={[s.detailRow, i < rows.length - 1 && s.detailBorder]}
                        >
                            <Text style={s.detailKey}>{k}</Text>
                            <Text style={s.detailVal} numberOfLines={2}>{v}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>

            <View style={s.bottomBar}>
                <TouchableOpacity style={s.backBtn} onPress={onEdit}>
                    <Ionicons name="create-outline" size={17} color={C.text} />
                    <Text style={s.backTxt}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={s.mainBtn}
                    onPress={onDownload}
                    disabled={generating}
                    activeOpacity={0.9}
                >
                    <LinearGradient colors={[C.primary, C.primaryDark]} style={s.mainGrad}>
                        {generating ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Ionicons name="download-outline" size={17} color="#fff" />
                                <Text style={s.mainTxt}>Download Resume</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────
// PURANE styles same. Sirf ek line change:
// mainBtn: { flex: 1 },   ← paddingBottom: 28 HATAO
// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F6F7F9" },

    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 18,
        borderBottomLeftRadius: 22,
        borderBottomRightRadius: 22,
    },
    headRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    headTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },

    progressTrack: {
        height: 5,
        backgroundColor: "rgba(255,255,255,0.28)",
        borderRadius: 99,
        overflow: "hidden",
    },
    progressFill: { height: "100%", backgroundColor: "#fff", borderRadius: 99 },

    stepRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 9 },
    stepTxt: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.92)" },

    readyBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        alignSelf: "flex-start",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
    },
    readyTxt: { fontSize: 11.5, fontWeight: "700", color: "#fff" },

    scroll: { padding: 18, paddingBottom: 30 },

    // Photo
    photoWrap: { alignSelf: "center", marginBottom: 22 },
    photo: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 3,
        borderColor: C.primary,
    },
    photoEdit: {
        position: "absolute",
        right: 2,
        bottom: 2,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: C.primary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#F6F7F9",
    },
    photoEmpty: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: C.primaryLight,
        borderWidth: 2,
        borderColor: C.primary,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
    },
    photoTxt: { fontSize: 11, fontWeight: "800", color: C.primary },

    // Status
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 13,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#EDEDF2",
    },
    statusIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    statusTxt: { flex: 1, fontSize: 13.5, fontWeight: "700", color: C.text },
    statusTag: { fontSize: 11.5, fontWeight: "800" },

    // Details
    detailCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#EDEDF2",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 10,
    },
    detailBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
    detailKey: { fontSize: 13, color: C.textSec, fontWeight: "600" },
    detailVal: {
        fontSize: 13,
        color: C.text,
        fontWeight: "700",
        maxWidth: "58%",
        textAlign: "right",
    },

    // Bottom bar
    bottomBar: {
        flexDirection: "row",
        gap: 10,
        padding: 14,
        paddingBottom: Platform.OS === "ios" ? 26 : 18,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#EDEDF2",
    },
    backBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        paddingHorizontal: 18,
        height: 50,
        borderRadius: 13,
        backgroundColor: "#F1F2F5",
    },
    backTxt: { fontSize: 13, fontWeight: "800", color: C.text },

    mainBtn: { flex: 1, paddingBottom: 32 },
    mainGrad: {
        height: 50,
        borderRadius: 13,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    expCard: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#EDEDF2",
    },
    expHead: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    expHeadTxt: { fontSize: 13, fontWeight: "800", color: C.primary },
    addExpBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: 46,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: C.primary,
        borderStyle: "dashed",
        backgroundColor: C.primaryLight,
        marginBottom: 4,
    },
    addExpTxt: { fontSize: 13, fontWeight: "800", color: C.primary },
    mainTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },
});