{:if form_set_name ne '':}
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { CommonActions } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { api, ApiError } from '../api/client'
import type { {:filesingularpascalcase:}, Page } from '../api/types'
import AppMenu from '../components/AppMenu'
import Button from '../components/Button'
{:if hasforeignkeys:}
import { entityLabel } from '../format'
{:endif:}
import { colors, radius, spacing } from '../theme'
import type { ScreenProps } from '../navigation/types'

const PAGE_SIZE = 10

export default function {:filepascalcase:}Screen({ navigation }: ScreenProps<'{:filepascalcase:}'>) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [items, setItems] = useState<{:filesingularpascalcase:}[]>([])
  const [page, setPage] = useState(0)
  const [last, setLast] = useState(true)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // Hamburger button (opens the app menu) in the navigation header.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="menu" size={24} color={colors.text} />
        </Pressable>
      ),
    })
  }, [navigation])

  const loadPage = useCallback(async (searchValue: string, pageValue: number) => {
    const params = new URLSearchParams({ search: searchValue, page: String(pageValue), size: String(PAGE_SIZE) })
    const result = await api<Page<{:filesingularpascalcase:}>>(`/api/{:filename:}?${params.toString()}`)
    setItems((prev) => (pageValue === 0 ? result.content : [...prev, ...result.content]))
    setPage(result.page)
    setLast(result.last)
    setTotal(result.totalElements)
  }, [])

  // debounce the search input (matches the 300ms delay of the web version)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // (re)load from page 0 whenever the (debounced) search changes
  const reload = useCallback(async (searchValue: string) => {
    setError(null)
    try {
      await loadPage(searchValue, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [loadPage])

  useEffect(() => {
    setLoading(true)
    void reload(debouncedSearch).finally(() => setLoading(false))
  }, [debouncedSearch, reload])

  // refresh the list every time we return to this screen (e.g. after create/edit/delete)
  useEffect(() => navigation.addListener('focus', () => { void reload(debouncedSearch) }),
    [navigation, reload, debouncedSearch])

  const onRefresh = async () => {
    setRefreshing(true)
    await reload(debouncedSearch)
    setRefreshing(false)
  }

  const onEndReached = async () => {
    if (last || loadingMore || loading) return
    setLoadingMore(true)
    try {
      await loadPage(debouncedSearch, page + 1)
    } catch {
      // keep the already-loaded items; a transient paging error is non-fatal
    } finally {
      setLoadingMore(false)
    }
  }

  const confirmDelete = (row: {:filesingularpascalcase:}) => {
    Alert.alert(
      'Delete {:filesingularlower:}',
      `Delete this {:filesingularlower:} (#${row.id})? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void (async () => {
            try {
              await api<void>(`/api/{:filename:}/${row.id}`, { method: 'DELETE' })
              await reload(debouncedSearch)
            } catch (err) {
              const message = err instanceof ApiError ? err.message : String(err)
              Alert.alert('Delete failed', message)
            }
          })(),
        },
      ],
    )
  }

  const renderItem = ({ item: row }: { item: {:filesingularpascalcase:} }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('{:filesingularpascalcase:}Detail', { id: row.id })}
    >
{:for nmaxitems:}
{:if item.isforeign:}
{:elseif item.isprimary:}
{:elseif item.istimestamp:}
{:else:}
      {row.{:item.camelcase:} != null && String(row.{:item.camelcase:}) !== '' ? (
        <Text style={styles.cardLine}>
          <Text style={styles.cardLabel}>{:item.caption:}: </Text>{String(row.{:item.camelcase:})}
        </Text>
      ) : null}
{:endif:}
{:endfor:}
{:for nmaxforeignkeys:}
      {row.{:foreign.referencedtablesingularcamelcase:} ? (
        <Text style={styles.cardCompany}>{entityLabel(row.{:foreign.referencedtablesingularcamelcase:})}</Text>
      ) : null}
{:endfor:}

      <View style={styles.cardActions}>
        <Pressable
          onPress={() => navigation.navigate('{:filesingularpascalcase:}Form', { id: row.id })}
          hitSlop={8}
          style={styles.actionBtn}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => confirmDelete(row)} hitSlop={8} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.destructive} />
          <Text style={[styles.actionText, { color: colors.destructive }]}>Delete</Text>
        </Pressable>
      </View>
    </Pressable>
  )

  return (
    <View style={styles.container}>
      <AppMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(route) => navigation.dispatch(CommonActions.navigate(route))}
        activeRoute="{:filepascalcase:}"
      />
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search…"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
        <View style={styles.toolbarButtons}>
          <Button
            title="New"
            onPress={() => navigation.navigate('{:filesingularpascalcase:}Form', {})}
            style={styles.toolbarBtn}
          />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(row) => String(row.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={() => void onEndReached()}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={<Text style={styles.count}>{total} {:filesingularlower:}(s)</Text>}
          ListEmptyComponent={<Text style={styles.empty}>No records found.</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} /> : null}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBtn: { paddingHorizontal: spacing.sm },
  toolbar: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.mutedSurface,
  },
  searchInput: { flex: 1, paddingVertical: spacing.md, fontSize: 15, color: colors.text },
  toolbarButtons: { flexDirection: 'row', gap: spacing.md },
  toolbarBtn: { flex: 1 },
  error: { color: colors.destructive, padding: spacing.lg },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.lg, gap: spacing.md },
  count: { color: colors.muted, fontSize: 13, marginBottom: spacing.xs },
  empty: { color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
  footer: { marginVertical: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardLine: { fontSize: 14, color: colors.text },
  cardLabel: { color: colors.muted },
  cardCompany: { fontSize: 14, color: colors.muted, fontStyle: 'italic' },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  actionText: { fontSize: 14, fontWeight: '600' },
})
{:endif:}
