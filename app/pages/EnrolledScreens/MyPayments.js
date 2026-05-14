import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StatusBar,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import useAuthStore from "../../store/useAuthStore";
import {
    Loader,
    AuthWarn
} from "../../components/LoadingAndAuthWarn";
import API from "../../utils/axiosInstanct";

export default function MyPayments() {
    const { user } = useAuthStore();

    const [payments, setPayments] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [loadingMore, setLoadingMore] =
        useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] =
        useState(1);

    const [search, setSearch] =
        useState("");

    const [type, setType] =
        useState("all");

    // ========================================
    // Fetch Payments
    // ========================================
    const fetchPayments = async (
        pageNo = 1,
        reset = false
    ) => {
        try {
            if (pageNo === 1) setLoading(true);
            else setLoadingMore(true);

            const res = await API.get(
                `/auth/my-payments?page=${pageNo}&limit=10&type=${type}&search=${search}`
            );

            const json = res.data;

            setPage(json.page);
            setTotalPages(json.totalPages);

            if (reset) {
                setPayments(json.data || []);
            } else {
                setPayments(prev => [
                    ...prev,
                    ...(json.data || [])
                ]);
            }

        } catch (error) {
            console.log(
                "Payments Error =>",
                error?.response?.data || error
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchPayments(1, true);
    }, [type]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPayments(1, true);
    };

    const loadMore = () => {
        if (
            page < totalPages &&
            !loadingMore
        ) {
            fetchPayments(page + 1);
        }
    };

    const handleSearch = () => {
        fetchPayments(1, true);
    };

    if (!user) return <AuthWarn />;
    if (loading) return <Loader />;

    const statusColor = status => {
        if (status === "success")
            return "#10B981";
        if (status === "failed")
            return "#EF4444";
        return "#F59E0B";
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle={"dark-content"} />

            {/* Header */}
            <LinearGradient
                colors={["#8B0000", "#D62828", "#EF4444"]}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>
                    My Payments
                </Text>

                <Text style={styles.headerSub}>
                    View your transactions &
                    purchases
                </Text>

                {/* Search */}
                <View style={styles.searchBox}>
                    <Ionicons
                        name="search-outline"
                        size={18}
                        color="#FECACA"
                    />

                    <TextInput
                        placeholder="Search payments..."
                        placeholderTextColor="#FECACA"
                        value={search}
                        onChangeText={setSearch}
                        onSubmitEditing={
                            handleSearch
                        }
                        style={styles.searchInput}
                    />
                </View>
            </LinearGradient>

            {/* Filter */}
            <View style={styles.filterWrap}>
                {[
                    "all",
                    "course",
                    "session"
                ].map(item => (
                    <TouchableOpacity
                        key={item}
                        onPress={() =>
                            setType(item)
                        }
                        style={[
                            styles.filterChip,
                            type === item &&
                            styles.activeChip
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                type === item && {
                                    color: "#fff"
                                }
                            ]}
                        >
                            {item.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            <FlatList
                data={payments}
                keyExtractor={item =>
                    item.id.toString()
                }
                refreshControl={
                    <RefreshControl
                        refreshing={
                            refreshing
                        }
                        onRefresh={
                            onRefresh
                        }
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.4}
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 80
                }}
                ListFooterComponent={
                    loadingMore ? (
                        <ActivityIndicator
                            color="#DC2626"
                            style={{
                                marginTop: 15
                            }}
                        />
                    ) : null
                }
                ListEmptyComponent={
                    <View
                        style={
                            styles.emptyWrap
                        }
                    >
                        <Ionicons
                            name="card-outline"
                            size={55}
                            color="#FCA5A5"
                        />
                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            No Payments Found
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        {/* Top */}
                        <View
                            style={
                                styles.rowBetween
                            }
                        >
                            <View
                                style={
                                    styles.row
                                }
                            >
                                {item.thumbnail ? (
                                    <Image
                                        source={{
                                            uri:
                                                item.thumbnail
                                        }}
                                        style={
                                            styles.image
                                        }
                                    />
                                ) : (
                                    <View
                                        style={
                                            styles.placeholder
                                        }
                                    >
                                        <Ionicons
                                            name="card-outline"
                                            size={
                                                18
                                            }
                                            color="#DC2626"
                                        />
                                    </View>
                                )}

                                <View
                                    style={{
                                        marginLeft: 10,
                                        flex: 1
                                    }}
                                >
                                    <Text
                                        numberOfLines={
                                            2
                                        }
                                        style={
                                            styles.title
                                        }
                                    >
                                        {
                                            item.title
                                        }
                                    </Text>

                                    <Text
                                        style={
                                            styles.type
                                        }
                                    >
                                        {
                                            item.payment_type
                                        }
                                    </Text>
                                </View>
                            </View>

                            <Text
                                style={
                                    styles.amount
                                }
                            >
                                ₹
                                {
                                    item.amount
                                }
                            </Text>
                        </View>

                        {/* Bottom */}
                        <View
                            style={
                                styles.bottom
                            }
                        >
                            <View
                                style={[
                                    styles.badge,
                                    {
                                        backgroundColor:
                                            statusColor(
                                                item.payment_status
                                            )
                                    }
                                ]}
                            >
                                <Text
                                    style={
                                        styles.badgeText
                                    }
                                >
                                    {
                                        item.payment_status
                                    }
                                </Text>
                            </View>

                            <Text
                                style={
                                    styles.date
                                }
                            >
                                {new Date(
                                    item.paid_at
                                ).toDateString()}
                            </Text>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles =
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor:
                "#FFF5F5"
        },

        header: {
            paddingHorizontal: 18,
            paddingTop: 20,
            paddingBottom: 20
        },

        headerTitle: {
            color: "#fff",
            fontSize: 25,
            fontWeight: "800"
        },

        headerSub: {
            color:
                "rgba(255,255,255,0.85)",
            marginTop: 4
        },

        searchBox: {
            marginTop: 16,
            backgroundColor:
                "rgba(255,255,255,0.12)",
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12
        },

        searchInput: {
            flex: 1,
            color: "#fff",
            paddingVertical: 12,
            marginLeft: 8
        },

        filterWrap: {
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingVertical: 12
        },

        filterChip: {
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor:
                "#FECACA",
            marginRight: 10
        },

        activeChip: {
            backgroundColor:
                "#DC2626"
        },

        filterText: {
            fontSize: 12,
            fontWeight: "700",
            color: "#991B1B"
        },

        card: {
            backgroundColor: "#fff",
            borderRadius: 18,
            padding: 14,
            marginBottom: 14,
            elevation: 2
        },

        row: {
            flexDirection: "row",
            alignItems: "center",
            flex: 1
        },

        rowBetween: {
            flexDirection: "row",
            justifyContent:
                "space-between",
            alignItems: "center"
        },

        image: {
            width: 52,
            height: 52,
            borderRadius: 12
        },

        placeholder: {
            width: 52,
            height: 52,
            borderRadius: 12,
            backgroundColor:
                "#FEE2E2",
            justifyContent:
                "center",
            alignItems: "center"
        },

        title: {
            fontSize: 14,
            fontWeight: "700",
            color: "#111827"
        },

        type: {
            marginTop: 4,
            fontSize: 12,
            color: "#DC2626",
            fontWeight: "600"
        },

        amount: {
            fontSize: 16,
            fontWeight: "800",
            color: "#111827"
        },

        bottom: {
            marginTop: 14,
            flexDirection: "row",
            justifyContent:
                "space-between",
            alignItems: "center"
        },

        badge: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20
        },

        badgeText: {
            color: "#fff",
            fontSize: 11,
            fontWeight: "700"
        },

        date: {
            fontSize: 12,
            color: "#6B7280"
        },

        emptyWrap: {
            marginTop: 120,
            alignItems: "center"
        },

        emptyTitle: {
            marginTop: 10,
            fontSize: 16,
            fontWeight: "700",
            color: "#991B1B"
        }
    });