import { COLORS } from "../../utils/dummyData";
import {

    StyleSheet,

    Dimensions,
} from "react-native"

const { width } = Dimensions.get("window")
const extraStyles = StyleSheet.create({
    pageHeader: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: "900",
        color: COLORS.text,
        width: "100%"
    },
    pageSubRow: {},
    pageSub: { fontSize: 13, color: COLORS.textSecondary },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.bg,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        flex: 1
    },
    searchInput: { flex: 1, fontSize: 14, color: COLORS.text },

    // Tests
    testStatsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3
    },
    testStat: { alignItems: "center", gap: 4 },
    testStatIcon: { fontSize: 24 },
    testStatVal: { fontSize: 18, fontWeight: "900", color: COLORS.text },
    testStatLabel: { fontSize: 11, color: COLORS.textSecondary },
    testFullCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderLeftWidth: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3
    },
    testFullHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 12
    },
    testFullIcon: { fontSize: 32 },
    testFullTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.text,
        flex: 1,
        lineHeight: 21
    },
    testFullSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
    diffBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    testFullMeta: { flexDirection: "row", gap: 10, marginBottom: 12 },
    metaPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: COLORS.bg,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5
    },
    metaPillText: { fontSize: 12, color: COLORS.textSecondary },
    testProgress: { gap: 6, marginBottom: 14 },
    testProgressText: { fontSize: 12, color: COLORS.textSecondary },
    testProgressBar: {
        height: 6,
        backgroundColor: COLORS.border,
        borderRadius: 3
    },
    testProgressFill: { height: 6, borderRadius: 3 },
    startTestBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
    startTestBtnText: { fontSize: 14, fontWeight: "800", color: "#fff" },

    // Test Attempt
    testHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    testHeaderTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.text,
        maxWidth: width * 0.5,
        textAlign: "center"
    },
    testHeaderSub: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: "center"
    },
    timerChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#FFF0F3",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5
    },
    timerText: { fontSize: 13, fontWeight: "700", color: COLORS.secondary },
    testProgressBarOuter: { height: 4, backgroundColor: COLORS.border },
    testProgressBarFill: { height: 4, backgroundColor: COLORS.primary },
    qCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3
    },
    qNumBadge: {
        backgroundColor: COLORS.primaryLight,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
        marginBottom: 10
    },
    qNumText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
    qText: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.text,
        lineHeight: 23
    },
    optCard: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderWidth: 1.5,
        borderColor: COLORS.border
    },
    optCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight
    },
    optLetter: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border
    },
    optLetterText: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.textSecondary
    },
    optText: { flex: 1, fontSize: 14, color: COLORS.text },
    testBottomNav: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.white,
        paddingHorizontal: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: COLORS.border
    },
    prevBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
    prevBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.primary },
    skipBtn: {
        backgroundColor: COLORS.bg,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 10
    },
    skipBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
    nextBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10
    },
    nextBtnText: { fontSize: 14, fontWeight: "800", color: "#fff" },
    submitTestBtn: {
        backgroundColor: COLORS.success,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10
    },
    submitTestText: { fontSize: 14, fontWeight: "800", color: "#fff" },

    // Result
    resultScreen: {
        flex: 1,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
        padding: 24
    },
    resultCard: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 28,
        alignItems: "center",
        width: "100%",
        gap: 10
    },
    resultTitle: { fontSize: 26, fontWeight: "900", color: COLORS.text },
    resultSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        textAlign: "center"
    },
    scoreCircle: {
        flexDirection: "row",
        alignItems: "baseline",
        marginVertical: 8,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 20,
        paddingHorizontal: 24,
        paddingVertical: 16
    },
    scoreNum: { fontSize: 48, fontWeight: "900", color: COLORS.primary },
    scoreTotal: { fontSize: 22, fontWeight: "600", color: COLORS.textSecondary },
    resultStats: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        paddingVertical: 8
    },
    resultStat: { alignItems: "center", gap: 4 },
    resultStatIcon: { fontSize: 22 },
    resultStatVal: { fontSize: 16, fontWeight: "800", color: COLORS.text },
    resultStatLabel: { fontSize: 11, color: COLORS.textSecondary },
    reviewBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 28,
        width: "100%",
        alignItems: "center"
    },
    reviewBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
    homeBtn: {
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 28,
        width: "100%",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: COLORS.border
    },
    homeBtnText: { fontSize: 15, fontWeight: "700", color: COLORS.textSecondary },

    // Mentors
    mentorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3
    },
    mentorRowAvatar: { width: 64, height: 64, borderRadius: 32 },
    mentorRowName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
    mentorRowExpertise: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4
    },
    mentorRowMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        marginBottom: 6
    },
    mentorRowRating: { fontSize: 12, fontWeight: "700", color: COLORS.text },
    mentorRowStudents: { fontSize: 11, color: COLORS.textSecondary },
    tagsRow: { flexDirection: "row", gap: 6 },
    tag: {
        backgroundColor: COLORS.primaryLight,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3
    },
    tagText: { fontSize: 10, fontWeight: "600", color: COLORS.primary },
    bookMiniBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    bookMiniBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },

    // Mentor Profile
    mentorBanner: {
        backgroundColor: COLORS.primary,
        alignItems: "center",
        paddingBottom: 30,
        paddingHorizontal: 20
    },
    mentorBackBtn: {
        position: "absolute",
        top: 50,
        left: 16,
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "rgba(0,0,0,0.25)",
        justifyContent: "center",
        alignItems: "center"
    },
    mentorBigAvatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 4,
        borderColor: "rgba(255,255,255,0.5)",
        marginBottom: 12
    },
    mentorBigName: {
        fontSize: 22,
        fontWeight: "900",
        color: "#fff",
        marginBottom: 4
    },
    mentorBigExpertise: {
        fontSize: 13,
        color: "rgba(255,255,255,0.75)",
        marginBottom: 16
    },
    mentorStatsRow: { flexDirection: "row", gap: 28 },
    mentorStat: { alignItems: "center" },
    mentorStatVal: { fontSize: 18, fontWeight: "900", color: "#fff" },
    mentorStatLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
    mentorCard: {
        backgroundColor: COLORS.white,
        margin: 16,
        borderRadius: 16,
        padding: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3
    },
    mentorCardTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: COLORS.text,
        marginBottom: 8
    },
    mentorBio: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
    expRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    expText: { fontSize: 14, color: COLORS.text },
    tagsRowFull: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tagFull: {
        backgroundColor: COLORS.primaryLight,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 7
    },
    tagFullText: { fontSize: 13, fontWeight: "700", color: COLORS.primary },
    sessionCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: COLORS.bg,
        borderRadius: 12,
        padding: 14
    },
    sessionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
    sessionDuration: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    sessionPrice: { fontSize: 16, fontWeight: "900", color: COLORS.primary },
    mentorCTA: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: COLORS.border
    },
    sessionPriceBig: { fontSize: 22, fontWeight: "900", color: COLORS.text },
    sessionPriceSub: { fontSize: 12, color: COLORS.textSecondary },
    bookSessionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingHorizontal: 22,
        paddingVertical: 13
    },
    bookSessionText: { fontSize: 15, fontWeight: "800", color: "#fff" },

    // Community
    askBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        margin: 16,
        marginTop: 12
    },
    askInput: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.text,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        maxHeight: 80
    },
    askBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center"
    },
    filterRow: { paddingHorizontal: 16, gap: 8, marginBottom: 4 },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: COLORS.bg,
        borderWidth: 1.5,
        borderColor: COLORS.border
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textSecondary
    },
    filterChipTextActive: { color: "#fff" },

    // Notifications
    notifCard: {
        flexDirection: "row",
        gap: 12,
        padding: 14,
        backgroundColor: COLORS.white,
        borderRadius: 14,
        marginBottom: 10
    },
    notifCardUnread: { backgroundColor: COLORS.primaryLight + "80" },
    notifIcon: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center"
    },
    notifTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 3
    },
    notifTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text, flex: 1 },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary
    },
    notifMsg: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
        marginBottom: 4
    },
    notifTime: { fontSize: 11, color: COLORS.textLight },

    // Profile
    profileHeader: {
        backgroundColor: COLORS.primary,
        alignItems: "center",
        paddingBottom: 30,
        paddingHorizontal: 20
    },
    profileAvatarWrap: { position: "relative", marginBottom: 12 },
    profileAvatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 4,
        borderColor: "rgba(255,255,255,0.5)"
    },
    editAvatarBtn: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff"
    },
    profileName: {
        fontSize: 22,
        fontWeight: "900",
        color: "#fff",
        marginBottom: 4
    },
    profileEmail: {
        fontSize: 13,
        color: "rgba(255,255,255,0.75)",
        marginBottom: 10
    },
    profileBadge: {
        backgroundColor: COLORS.accentOrange,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 5
    },
    profileBadgeText: { textTransform: "capitalize", fontSize: 10, fontWeight: "800", color: "#fff" },
    profileStats: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: COLORS.white,
        marginHorizontal: 16,
        marginTop: -16,
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 14
    },
    profileStat: { alignItems: "center", gap: 4 },
    profileStatVal: { fontSize: 16, fontWeight: "900", color: COLORS.text },
    profileStatLabel: { fontSize: 11, color: COLORS.textSecondary },
    menuCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
        overflow: "hidden"
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center"
    },
    menuLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text },
    versionText: {
        textAlign: "center",
        fontSize: 12,
        color: COLORS.textLight,
        paddingBottom: 10
    }
})

export default extraStyles