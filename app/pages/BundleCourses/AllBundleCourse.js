import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Image,
    FlatList,
    Modal,
    Pressable,
} from "react-native";
import Layout from "../../components/layout";
import API from "../../utils/axiosInstanct";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const RED = "#D32F2F";
const RED_DARK = "#B71C1C";
const WHITE = "#FFFFFF";
const BLACK = "#000000";
const GREY = "#767676";
const LIGHT_GREY = "#F4F4F4";
const BORDER = "#EBEBEB";

const FILTERS = [
    { key: "all", label: "All" },
    { key: "free", label: "Free" },
    { key: "discount", label: "On Discount" },
    { key: "paid", label: "Paid" },
];

export default function AllBundleCourse() {
    const navigation = useNavigation();

    const [bundles, setBundles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [pendingFilter, setPendingFilter] = useState("all");

    const fetchBundles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await API.get("/bundle/get-all-bundle-courses");

            if (res?.data?.success) {
                setBundles(res.data.data || []);
            } else {
                setError("Unable to load bundles.");
            }
        } catch (err) {
            console.error("[AllBundleCourse] fetch error", err);
            setError("Something went wrong while loading bundles.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBundles();
    }, [fetchBundles]);

    const filteredBundles = useMemo(() => {
        let list = bundles;

        if (activeFilter === "free") {
            list = list.filter((b) => b.is_free === 1);
        } else if (activeFilter === "discount") {
            list = list.filter((b) => b.has_discount === 1 && b.discount_price);
        } else if (activeFilter === "paid") {
            list = list.filter((b) => b.is_free !== 1);
        }

        const query = searchText.trim().toLowerCase();
        if (!query) return list;

        return list.filter((bundle) => {
            const bundleMatch =
                bundle.title?.toLowerCase().includes(query) ||
                bundle.short_description?.toLowerCase().includes(query);

            const courseMatch = (bundle.courses || []).some((course) =>
                course.title?.toLowerCase().includes(query)
            );

            return bundleMatch || courseMatch;
        });
    }, [bundles, searchText, activeFilter]);

    const handleViewBundle = (bundle) => {
        navigation.navigate("BundleDetails", { bundleId: bundle.id });
    };

    const openFilterModal = () => {
        setPendingFilter(activeFilter);
        setFilterModalVisible(true);
    };

    const applyFilter = () => {
        setActiveFilter(pendingFilter);
        setFilterModalVisible(false);
    };

    const clearFilter = () => {
        setPendingFilter("all");
        setActiveFilter("all");
        setFilterModalVisible(false);
    };

    const renderBundleCard = ({ item: bundle }) => {
        const hasDiscount = bundle.has_discount && bundle.discount_price;
        const isFree = bundle.is_free === 1;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleViewBundle(bundle)}
                activeOpacity={0.85}
            >
                <View style={styles.thumbWrapper}>
                    {bundle.thumbnail ? (
                        <Image
                            source={{ uri: bundle.thumbnail }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                            <Ionicons name="albums-outline" size={28} color={WHITE} />
                        </View>
                    )}

                    {isFree ? (
                        <View style={[styles.badge, styles.freeBadge]}>
                            <Text style={styles.badgeText}>FREE</Text>
                        </View>
                    ) : hasDiscount ? (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {Math.round(
                                    (1 -
                                        parseFloat(bundle.discount_price) /
                                            parseFloat(bundle.price)) *
                                        100
                                )}
                                % OFF
                            </Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                        {bundle.title}
                    </Text>

                    {bundle.courses?.length ? (
                        <View style={styles.courseCountRow}>
                            <Ionicons name="book-outline" size={12} color={GREY} />
                            <Text style={styles.courseCountText}>
                                {bundle.courses.length} course
                                {bundle.courses.length > 1 ? "s" : ""}
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.priceRow}>
                        {isFree ? (
                            <Text style={styles.freeText}>Free</Text>
                        ) : hasDiscount ? (
                            <>
                                <Text style={styles.discountPrice}>
                                    ₹{bundle.discount_price}
                                </Text>
                                <Text style={styles.originalPrice}>₹{bundle.price}</Text>
                            </>
                        ) : (
                            <Text style={styles.discountPrice}>₹{bundle.price}</Text>
                        )}
                    </View>

                    <View style={styles.viewBundleButton}>
                        <Text style={styles.viewBundleButtonText}>View Bundle</Text>
                        <Ionicons name="arrow-forward" size={13} color={WHITE} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const activeFilterLabel = FILTERS.find((f) => f.key === activeFilter)?.label;
    const isFilterActive = activeFilter !== "all";

    return (
        <Layout
            headerType="backTitle"
            subtitle={"Home > Bundle Courses"}
            scrollable={true}
            onBack={() => navigation.goBack()}
            title={"Bundle Courses"}
        >
            <View style={styles.toolbar}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color={GREY} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search bundles or courses"
                        placeholderTextColor={GREY}
                        value={searchText}
                        onChangeText={setSearchText}
                        returnKeyType="search"
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText("")} hitSlop={8}>
                            <Ionicons name="close-circle" size={18} color={GREY} />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.filterButton, isFilterActive && styles.filterButtonActive]}
                    onPress={openFilterModal}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name="options-outline"
                        size={18}
                        color={isFilterActive ? WHITE : BLACK}
                    />
                </TouchableOpacity>
            </View>

            {isFilterActive && (
                <View style={styles.activeFilterRow}>
                    <View style={styles.activeFilterChip}>
                        <Text style={styles.activeFilterChipText}>{activeFilterLabel}</Text>
                        <TouchableOpacity onPress={clearFilter} hitSlop={6}>
                            <Ionicons name="close" size={14} color={WHITE} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {loading ? (
                <View style={styles.centerFill}>
                    <ActivityIndicator size="large" color={RED} />
                </View>
            ) : error ? (
                <View style={styles.centerFill}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchBundles}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : filteredBundles.length === 0 ? (
                <View style={styles.centerFill}>
                    <Ionicons name="search-outline" size={40} color={GREY} />
                    <Text style={styles.emptyText}>No bundles found.</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredBundles}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderBundleCard}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                />
            )}

            <Modal
                visible={filterModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setFilterModalVisible(false)}
                >
                    <Pressable style={styles.modalSheet} onPress={() => {}}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter</Text>
                            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                <Ionicons name="close" size={22} color={BLACK} />
                            </TouchableOpacity>
                        </View>

                        {FILTERS.map((f) => {
                            const selected = pendingFilter === f.key;
                            return (
                                <TouchableOpacity
                                    key={f.key}
                                    style={styles.filterOption}
                                    onPress={() => setPendingFilter(f.key)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.filterOptionText,
                                            selected && styles.filterOptionTextSelected,
                                        ]}
                                    >
                                        {f.label}
                                    </Text>
                                    <Ionicons
                                        name={selected ? "radio-button-on" : "radio-button-off"}
                                        size={20}
                                        color={selected ? RED : GREY}
                                    />
                                </TouchableOpacity>
                            );
                        })}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.clearButton} onPress={clearFilter}>
                                <Text style={styles.clearButtonText}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyButton} onPress={applyFilter}>
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </Layout>
    );
}

const styles = StyleSheet.create({
    toolbar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 10,
        marginBottom: 6,
    },
    searchBar: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: LIGHT_GREY,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: BLACK,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: LIGHT_GREY,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 10,
    },
    filterButtonActive: {
        backgroundColor: RED,
    },
    activeFilterRow: {
        flexDirection: "row",
        paddingHorizontal: 16,
        marginBottom: 10,
        marginTop: 4,
    },
    activeFilterChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: RED,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    activeFilterChipText: {
        color: WHITE,
        fontSize: 12,
        fontWeight: "600",
        marginRight: 6,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 24,
    },
    columnWrapper: {
        justifyContent: "space-between",
    },
    card: {
        width: "48.5%",
        backgroundColor: WHITE,
        borderRadius: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: "hidden",
    },
    thumbWrapper: {
        position: "relative",
    },
    thumbnail: {
        width: "100%",
        height: 100,
        backgroundColor: LIGHT_GREY,
    },
    thumbnailPlaceholder: {
        backgroundColor: RED,
        alignItems: "center",
        justifyContent: "center",
    },
    badge: {
        position: "absolute",
        top: 8,
        left: 8,
        backgroundColor: RED_DARK,
        borderRadius: 6,
        paddingVertical: 3,
        paddingHorizontal: 6,
    },
    freeBadge: {
        backgroundColor: RED,
    },
    badgeText: {
        color: WHITE,
        fontSize: 10,
        fontWeight: "700",
    },
    cardBody: {
        padding: 10,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: BLACK,
        marginBottom: 6,
        minHeight: 34,
    },
    courseCountRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    courseCountText: {
        fontSize: 11,
        color: GREY,
        marginLeft: 4,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        flexWrap: "wrap",
    },
    freeText: {
        fontSize: 14,
        fontWeight: "700",
        color: RED,
    },
    discountPrice: {
        fontSize: 14,
        fontWeight: "700",
        color: RED,
        marginRight: 6,
    },
    originalPrice: {
        fontSize: 11,
        color: GREY,
        textDecorationLine: "line-through",
    },
    viewBundleButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: RED,
        borderRadius: 8,
        paddingVertical: 8,
    },
    viewBundleButtonText: {
        color: WHITE,
        fontWeight: "700",
        fontSize: 11,
        marginRight: 4,
    },
    centerFill: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 60,
    },
    errorText: {
        color: BLACK,
        fontSize: 14,
        textAlign: "center",
        marginBottom: 12,
    },
    retryButton: {
        backgroundColor: RED,
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    retryButtonText: {
        color: WHITE,
        fontWeight: "700",
    },
    emptyText: {
        color: GREY,
        marginTop: 10,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        backgroundColor: WHITE,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 58,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: BLACK,
    },
    filterOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    filterOptionText: {
        fontSize: 14,
        color: BLACK,
    },
    filterOptionTextSelected: {
        color: RED,
        fontWeight: "700",
    },
    modalActions: {
        flexDirection: "row",
        marginTop: 20,
    },
    clearButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 10,
        paddingVertical: 13,
        alignItems: "center",
        marginRight: 10,
    },
    clearButtonText: {
        color: BLACK,
        fontWeight: "700",
        fontSize: 14,
    },
    applyButton: {
        flex: 1,
        backgroundColor: RED,
        borderRadius: 10,
        paddingVertical: 13,
        alignItems: "center",
    },
    applyButtonText: {
        color: WHITE,
        fontWeight: "700",
        fontSize: 14,
    },
});