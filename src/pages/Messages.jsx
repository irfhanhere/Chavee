import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import Toast, { useToast } from '../components/Toast.jsx';
import PayoutSetupForm from '../components/PayoutSetupForm.jsx';
import { usePresence } from '../hooks/usePresence.js';
import { PAYOUTS_LIVE } from '../featureFlags.js';

import ConversationList from '../components/messages/ConversationList.jsx';
import ChatWindow from '../components/messages/ChatWindow.jsx';
import RightSidebar from '../components/messages/RightSidebar.jsx';
import { ConversationListSkeleton, ChatWindowSkeleton } from '../components/messages/SkeletonLoaders.jsx';
import DeliveryFiles from '../components/messages/DeliveryFiles.jsx';
import { sanitizeFilenameForStorageKey } from '../utils/attachmentStorage.js';

export default function Messages() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeId = searchParams.get('id');

    const { toast, showToast, hideToast } = useToast();
    const [user, setUser] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    
    const [conversations, setConversations] = useState([]);
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [roomTab, setRoomTab] = useState('Chats'); // 'Chats' | 'Gig Rooms' — independent of the Connect/Request filter above

    // Gig context
    const [gigContext, setGigContext] = useState(null);
    const [showCreateOffer, setShowCreateOffer] = useState(false);
    const [offerForm, setOfferForm] = useState({ items: [{ description: '', price: '' }], delivery_days: '', revisions: '', terms: '' });
    const [submittingOffer, setSubmittingOffer] = useState(false);

    // Negotiate state
    const [showNegotiateForm, setShowNegotiateForm] = useState(false);
    const [negotiateForm, setNegotiateForm] = useState({ checked: {}, terms: '' });
    const [submittingNegotiate, setSubmittingNegotiate] = useState(false);

    // Cashfree vendor onboarding
    const [vendorModal, setVendorModal] = useState(null); // null | { sellerId, offerId }

    // Payment state
    // phase: 'checkout' (Dropin overlay open) → 'confirming' (Dropin says the
    // card/UPI step succeeded, but we're now waiting for cashfree-webhook to
    // actually write gig_contracts.payment_status — the only thing we trust)
    // → 'timeout' (still unconfirmed after a while; offer a manual re-check).
    const [paymentModal, setPaymentModal] = useState(null); // null | { offerId, orderId, contractId, paymentSessionId, amounts, phase }
    const [processingPayment, setProcessingPayment] = useState(false);

    // Deliver work state
    const [deliveryModal, setDeliveryModal] = useState(null); // null | { contractId }
    const [deliveryMessage, setDeliveryMessage] = useState('');
    const [deliveryFile, setDeliveryFile] = useState(null);
    const [submittingDelivery, setSubmittingDelivery] = useState(false);

    // Store follow relationships for determining "Connections"
    const [connectionsData, setConnectionsData] = useState([]);

    const [messagesCache, setMessagesCache] = useState({});
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [showRightSidebar, setShowRightSidebar] = useState(false);
    
    const { onlineUsers } = usePresence();

    // Refs for stable callbacks in Realtime subscriptions
    const conversationsRef = useRef(conversations);
    const messagesCacheRef = useRef(messagesCache);
    
    useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
    useEffect(() => { messagesCacheRef.current = messagesCache; }, [messagesCache]);

    // Initial Auth & Profile Fetch
    useEffect(() => {
        let isMounted = true;
        
        const checkSessionAndFetchProfile = async (session) => {
            if (!session) {
                if (isMounted) navigate('/login');
                return;
            }
            
            if (isMounted) setUser(session.user);
            
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, username')
                    .eq('id', session.user.id)
                    .single();
                if (isMounted) setCurrentUserProfile(profile);
            } catch (err) {
                console.error("Failed to fetch user profile", err);
            }
            if (isMounted) setAuthLoading(false);
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (isMounted) checkSessionAndFetchProfile(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (isMounted) checkSessionAndFetchProfile(session);
        });

        return () => { 
            isMounted = false; 
            subscription?.unsubscribe();
        };
    }, [navigate]);

    const fetchConversations = useCallback(async () => {
        if (!user) return;
        try {
            // Fetch connections
            const { data: conns, error: ef } = await supabase
                .from('connections')
                .select('user_one, user_two, connected_at')
                .or(`user_one.eq.${user.id},user_two.eq.${user.id}`);
            if (ef) throw ef;
            setConnectionsData(conns || []);

            // Fetch conversations
            const { data: myConvs, error: e1 } = await supabase
                .from('conversation_participants').select('conversation_id').eq('user_id', user.id);
            if (e1) throw e1;
            
            const convIds = myConvs?.map(c => c.conversation_id) || [];
            if (convIds.length === 0) { setConversations([]); setLoadingConvs(false); return; }

            const { data: allPartsRaw, error: e2 } = await supabase
                .from('conversation_participants')
                .select('conversation_id, user_id')
                .in('conversation_id', convIds);
            if (e2) throw e2;

            const { data: convTypeRows, error: e2b } = await supabase
                .from('conversations')
                .select('id, type')
                .in('id', convIds);
            if (e2b) throw e2b;
            const convTypeById = Object.fromEntries((convTypeRows || []).map(c => [c.id, c.type]));

            const userIds = [...new Set(allPartsRaw?.map(p => p.user_id) || [])];
            
            const { data: profiles, error: e3 } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, college')
                .in('id', userIds);
            if (e3) throw e3;

            const allParts = allPartsRaw?.map(p => ({
                ...p,
                profiles: profiles?.find(prof => prof.id === p.user_id) || null
            }));

            const convDataPromises = convIds.map(async cid => {
                const [lastMsgRes, unreadRes] = await Promise.all([
                    supabase.from('messages')
                        .select('id, conversation_id, sender_id, content, file_url, created_at, is_read')
                        .eq('conversation_id', cid)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle(),
                    supabase.from('messages')
                        .select('id', { count: 'exact', head: true })
                        .eq('conversation_id', cid)
                        .neq('sender_id', user.id)
                        .eq('is_read', false)
                ]);
                return {
                    cid,
                    lastMsg: lastMsgRes.data || null,
                    unread: unreadRes.count || 0
                };
            });

            const convData = await Promise.all(convDataPromises);

            const grouped = convIds.map(cid => {
                const parts = allParts?.filter(p => p.conversation_id === cid) || [];
                const peer = parts.find(p => p.user_id !== user.id)?.profiles;
                const peerId = peer?.id;
                
                const cData = convData.find(d => d.cid === cid);
                const lastMsg = cData?.lastMsg || null;
                const unread = cData?.unread || 0;
                
                // Check if peerId is in our connections (new connections system)
                const isConnection = peerId ? (conns || []).some(c =>
                    (c.user_one === user.id && c.user_two === peerId) ||
                    (c.user_two === user.id && c.user_one === peerId)
                ) : false;

                return {
                    id: cid,
                    peer: peer || { id: 'unknown', full_name: 'Unknown User' },
                    peerId,
                    lastMsg,
                    unread,
                    updatedAt: lastMsg ? new Date(lastMsg.created_at).getTime() : 0,
                    isConnection,
                    type: convTypeById[cid] || 'dm'
                };
            }).sort((a, b) => b.updatedAt - a.updatedAt);
            
            setConversations(grouped);
        } catch (err) {
            console.error('fetchConversations error:', err);
            showToast('Failed to load conversations', 'error');
        } finally {
            setLoadingConvs(false);
        }
    }, [user, showToast]);

    useEffect(() => { 
        if (user) fetchConversations(); 
    }, [user, fetchConversations]);

    // Fetch active conversation messages & setup realtime
    useEffect(() => {
        if (!user || !activeId) return;

        let channel;
        let isMounted = true;

        const loadActiveConversation = async () => {
            // Only show loading state if we don't have cached messages yet
            if (!messagesCacheRef.current[activeId]) {
                setLoadingMsgs(true);
            }
            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', activeId)
                    .order('created_at', { ascending: true });
                if (error) throw error;
                
                if (isMounted) {
                    setMessagesCache(prev => ({ ...prev, [activeId]: data || [] }));

                    // Mark unread as read
                    const unreadIds = (data || []).filter(m => m.sender_id !== user.id && m.is_read === false).map(m => m.id);
                    if (unreadIds.length > 0) {
                        supabase.from('messages').update({ is_read: true, read_at: new Date().toISOString() }).in('id', unreadIds).then(()=>{});
                        setConversations(prev => prev.map(c => c.id === activeId ? { ...c, unread: 0 } : c));
                    }
                }
            } catch (err) {
                console.error('loadMessages error:', err);
                if (isMounted) showToast('Failed to load messages', 'error');
            } finally {
                if (isMounted) setLoadingMsgs(false);
            }
        };

        loadActiveConversation();

        // Setup realtime (No dependencies from component state that change rapidly)
        channel = supabase.channel(`messages:${activeId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` }, (payload) => {
                const newMsg = payload.new;
                
                // Update messages cache
                setMessagesCache(prev => {
                    const existing = prev[activeId] || [];
                    if (existing.some(m => m.id === newMsg.id)) return prev;
                    return { ...prev, [activeId]: [...existing, newMsg] };
                });

                // Auto-read if received while active
                if (newMsg.sender_id !== user.id) {
                    supabase.from('messages').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', newMsg.id).then(()=>{});
                }

                // Update conversation list preview without triggering full refetch
                setConversations(prev => {
                    return prev.map(c => {
                        if (c.id === activeId) {
                            return { 
                                ...c, 
                                lastMsg: newMsg, 
                                updatedAt: new Date(newMsg.created_at).getTime(),
                                unread: 0 // Since we are actively viewing it
                            };
                        }
                        return c;
                    }).sort((a, b) => b.updatedAt - a.updatedAt);
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` }, (payload) => {
                setMessagesCache(prev => {
                    const existing = prev[activeId] || [];
                    return { ...prev, [activeId]: existing.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m) };
                });
            })
            .subscribe();

        return () => { 
            isMounted = false;
            if (channel) supabase.removeChannel(channel); 
        };
    }, [user, activeId]);

    // Fetch Gig Context
    const loadGigContext = useCallback(async () => {
        if (!user || !activeId) {
            setGigContext(null);
            setShowCreateOffer(false);
            return;
        }
        try {
            // 1. Find if this conversation is linked to a gig application.
            //    conversations are reused per (poster, applicant) pair across ALL their
            //    gigs (intentional — same pattern as community group chat), so a single
            //    conversation_id can legitimately have more than one gig_applications row
            //    once the same two people transact on a second gig. .single() used to be
            //    used here and would throw on 2+ rows, silently blanking the whole Gig Room
            //    widget with no visible error. Fetch all matches instead and deterministically
            //    take the most recently created one — the gig currently most relevant to
            //    this pair's shared thread.
            const { data: appMatches, error: appErr } = await supabase
                .from('gig_applications')
                .select('*, gigs(*)')
                .eq('conversation_id', activeId)
                .order('created_at', { ascending: false })
                .limit(1);

            const appData = appMatches?.[0] || null;

            if (appErr || !appData) {
                setGigContext(null);
                return;
            }

            const isSeller = user.id === appData.applicant_id;
            const isBuyer = user.id === appData.gigs?.posted_by;

            // 2. Fetch ALL offers for the application to:
            //    a) Find the latest pending offer (shown in the card)
            //    b) Count chain depth for the negotiate cap
            const { data: allOffers } = await supabase
                .from('gig_offers')
                .select('*')
                .eq('gig_application_id', appData.id)
                .order('created_at', { ascending: true });

            const latestPending = (allOffers || [])
                .filter(o => o.status === 'pending')
                .slice(-1)[0] || null;

            const latestAccepted = (allOffers || [])
                .filter(o => o.status === 'accepted')
                .slice(-1)[0] || null;

            // Chain depth = number of counter-offers (rows with a parent_offer_id set)
            const chainDepth = (allOffers || []).filter(o => o.parent_offer_id != null).length;

            const activeOffer = latestPending || latestAccepted || null;

            // 2b. Line items for the active offer (gig_offer_items). Legacy offers created
            //     before line items existed have no rows here — the UI renders those as a
            //     single synthetic "Service" line at offer.price instead of breaking.
            let activeOfferItems = [];
            if (activeOffer) {
                const { data: itemsData, error: itemsErr } = await supabase
                    .from('gig_offer_items')
                    .select('*')
                    .eq('gig_offer_id', activeOffer.id)
                    .order('sort_order', { ascending: true });
                if (itemsErr) console.error('Error loading offer line items:', itemsErr);
                activeOfferItems = itemsData || [];
            }

            // 3. If the active offer is accepted, look up its payment/work status so the
            //    UI can reflect whether the buyer has paid, and where the delivery stands.
            let contractPaymentStatus = null;
            let contract = null;
            if (activeOffer?.status === 'accepted') {
                const { data: contractData } = await supabase
                    .from('gig_contracts')
                    .select('id, payment_status, status, buyer_response_deadline, work_submitted_at, delivery_message, delivery_file_url')
                    .eq('gig_offer_id', activeOffer.id)
                    .single();
                contract = contractData || null;
                contractPaymentStatus = contract?.payment_status || null;
            }

            setGigContext({
                application: appData,
                gig: appData.gigs,
                isSeller,
                isBuyer,
                activeOffer,
                activeOfferItems,
                allOffers: allOffers || [],
                chainDepth,
                contractPaymentStatus,
                contract
            });
            setShowCreateOffer(false);
        } catch (err) {
            console.error('Error loading gig context:', err);
        }
    }, [user, activeId]);

    useEffect(() => {
        loadGigContext();
    }, [loadGigContext]);

    // Check if seller needs to complete payout setup when gig page loads
    // Runs when gigContext is loaded and contains an accepted offer
    useEffect(() => {
        // Payouts are manual bank/UPI transfer until Chavee Technologies LLP registers —
        // cashfree-create-vendor has no local source anymore and shouldn't be fronted by
        // this modal. See featureFlags.js.
        if (!PAYOUTS_LIVE) return;
        if (!gigContext || !user) return;

        // Only show for the seller, when offer is accepted, and they haven't completed payout setup
        if (gigContext.isSeller &&
            gigContext.activeOffer?.status === 'accepted' &&
            gigContext.application?.applicant_id === user.id) {

            // Check current user's profile for cashfree_vendor_id
            const checkVendorStatus = async () => {
                try {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('cashfree_vendor_id')
                        .eq('id', user.id)
                        .single();

                    if (error) {
                        console.error('Failed to fetch profile for vendor check:', error);
                        return;
                    }

                    if (!profile?.cashfree_vendor_id) {
                        // Seller hasn't completed payout setup — open the vendor onboarding modal
                        setVendorModal({
                            sellerId: user.id,
                            offerId: gigContext.activeOffer.id
                        });
                    }
                } catch (err) {
                    console.error('Error checking vendor status:', err);
                }
            };

            checkVendorStatus();
        }
    }, [gigContext, user]);

    const handleCreateOfferSubmit = async (e) => {
        e.preventDefault();
        if (!gigContext || !user) return;

        // Line items are the source of truth for price — gig_offers.price is kept in sync
        // as their computed sum (see note above the offer form) rather than typed directly.
        const cleanItems = offerForm.items
            .map(it => ({ description: it.description.trim(), price: Number(it.price) }))
            .filter(it => it.description && it.price > 0);

        if (cleanItems.length === 0) {
            showToast('Add at least one line item with a description and price.', 'error');
            return;
        }

        const computedPrice = cleanItems.reduce((sum, it) => sum + it.price, 0);

        setSubmittingOffer(true);
        let newOfferId = null;
        try {
            const { data: newOffer, error } = await supabase.from('gig_offers').insert({
                gig_application_id: gigContext.application.id,
                gig_id: gigContext.gig.id,
                seller_id: user.id,
                buyer_id: gigContext.gig.posted_by,
                price: computedPrice,
                delivery_days: Number(offerForm.delivery_days),
                revisions: Number(offerForm.revisions),
                terms: offerForm.terms,
                status: 'pending'
            }).select().single();
            if (error) throw error;
            newOfferId = newOffer.id;

            const { error: itemsError } = await supabase.from('gig_offer_items').insert(
                cleanItems.map((it, idx) => ({
                    gig_offer_id: newOffer.id,
                    description: it.description,
                    price: it.price,
                    sort_order: idx
                }))
            );
            if (itemsError) throw itemsError;

            showToast('Offer created successfully!', 'success');
            setShowCreateOffer(false);
            setOfferForm({ items: [{ description: '', price: '' }], delivery_days: '', revisions: '', terms: '' });
            loadGigContext(); // Reload to show the pending offer
        } catch (err) {
            console.error('Error creating offer:', err);
            // If the offer row was created but its line items failed to write, don't leave
            // an orphaned offer behind — roll it back so the seller can just retry cleanly.
            if (newOfferId) {
                await supabase.from('gig_offers').delete().eq('id', newOfferId);
            }
            showToast('Failed to create offer.', 'error');
        } finally {
            setSubmittingOffer(false);
        }
    };

    const handleOfferAction = async (offerId, action) => {
        try {
            const { error } = await supabase.from('gig_offers').update({ status: action }).eq('id', offerId);
            if (error) throw error;

            if (action === 'accepted') {
                // Mark the gig as filled so it no longer appears on the public /earn listing
                if (gigContext?.gig?.id) {
                    const { error: gigErr } = await supabase
                        .from('gigs')
                        .update({ status: 'filled' })
                        .eq('id', gigContext.gig.id);
                    if (gigErr) console.error('Failed to mark gig as filled:', gigErr);
                }

                showToast('Offer accepted! 🎉', 'success');
            }

            loadGigContext();
        } catch (err) {
            console.error(`Error updating offer to ${action}:`, err);
            showToast('Action failed', 'error');
        }
    };

    const handleInitiatePayment = async (offerId) => {
        if (!user) return;
        setProcessingPayment(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

            const response = await fetch(`${supabaseUrl}/functions/v1/cashfree-create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ gig_offer_id: offerId }),
            });

            const json = await response.json();

            if (!response.ok) {
                throw new Error(json?.error || json?.message || `Server error (${response.status})`);
            }

            // Snapshot the line items being paid for, so the checkout summary can show them —
            // same fallback as the Offer Card: real gig_offer_items, or a synthetic Service row
            // for legacy offers.
            const rawItems = gigContext?.activeOfferItems || [];
            const lineItems = rawItems.length > 0
                ? rawItems
                : [{ id: 'synthetic', description: 'Service', price: json.amounts?.offer_price ?? 0 }];

            // Open payment modal with Cashfree Dropin
            setPaymentModal({
                offerId,
                orderId: json.order_id,
                contractId: json.contract_id,
                paymentSessionId: json.payment_session_id,
                amounts: json.amounts,
                lineItems,
                // The env this order was actually created against — cashfree-create-order now
                // echoes back its own CASHFREE_ENV so the Dropin SDK below never drifts from it.
                // Falls back to 'sandbox' (never 'production') if an older deployed function
                // hasn't been redeployed with this field yet — same fail-safe default the
                // backend itself uses.
                environment: json.environment === 'production' ? 'production' : 'sandbox',
                phase: 'checkout',
            });
        } catch (err) {
            console.error('Error initiating payment:', err);
            showToast(err.message || 'Failed to initiate payment', 'error');
        } finally {
            setProcessingPayment(false);
        }
    };

    // Only ever called once cashfree-webhook has actually written
    // gig_contracts.payment_status = 'paid' — never from the Dropin
    // checkout Promise resolving. See the 'confirming'-phase effect below.
    const handlePaymentConfirmed = async () => {
        showToast('Payment successful! 🎉', 'success');
        setPaymentModal(null);
        loadGigContext();
    };

    const handleDeliverWork = async (e) => {
        e.preventDefault();
        if (!deliveryModal || !user) return;
        setSubmittingDelivery(true);
        try {
            // Deliveries now go to the private gig-deliveries bucket (not the
            // shared message-attachments bucket) and no longer write
            // delivery_file_url directly — a server-side Edge Function
            // (generate-delivery-preview) verifies the caller is really the
            // seller on this contract, generates a real preview for images,
            // and records the gig_delivery_files row itself via service role.
            // The client can never forge that row or the original path.
            if (deliveryFile) {
                const fileName = `${Date.now()}_${sanitizeFilenameForStorageKey(deliveryFile.name)}`;
                const filePath = `${deliveryModal.contractId}/${fileName}`;
                const { error: uploadError } = await supabase.storage
                    .from('gig-deliveries')
                    .upload(filePath, deliveryFile, { cacheControl: '3600', upsert: false });
                if (uploadError) throw uploadError;

                const { data: sessionData } = await supabase.auth.getSession();
                const accessToken = sessionData?.session?.access_token;
                const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

                const previewResponse = await fetch(`${supabaseUrl}/functions/v1/generate-delivery-preview`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        contract_id: deliveryModal.contractId,
                        storage_path: filePath,
                        file_name: deliveryFile.name,
                        file_type: deliveryFile.type,
                    }),
                });
                const previewJson = await previewResponse.json();
                if (!previewResponse.ok) {
                    throw new Error(previewJson?.error || `Server error (${previewResponse.status})`);
                }
            }

            const { error } = await supabase
                .from('gig_contracts')
                .update({
                    status: 'submitted',
                    work_submitted_at: new Date().toISOString(),
                    delivery_message: deliveryMessage.trim() || null,
                })
                .eq('id', deliveryModal.contractId);
            if (error) throw error;

            showToast('Work submitted! 🎉', 'success');
            setDeliveryModal(null);
            setDeliveryMessage('');
            setDeliveryFile(null);
            loadGigContext();
        } catch (err) {
            console.error('Error submitting work:', err);
            showToast('Failed to submit work: ' + (err.message || 'Action failed'), 'error');
        } finally {
            setSubmittingDelivery(false);
        }
    };

    const handleApproveWork = async (contractId) => {
        try {
            const { error } = await supabase
                .from('gig_contracts')
                .update({ status: 'approved', approved_at: new Date().toISOString() })
                .eq('id', contractId);
            if (error) throw error;

            showToast('Work approved! 🎉', 'success');
            loadGigContext();
            // Used to fire-and-forget a call to cashfree-release-settlement here to
            // request early Easy Split settlement. That function is deleted — Easy
            // Split and Payouts are both confirmed unavailable on our Individual
            // Cashfree account, so there is nothing to release early anymore.
        } catch (err) {
            console.error('Error approving work:', err);
            showToast('Action failed', 'error');
        }
    };

    // Drive the Cashfree Dropin checkout whenever a new payment order is opened.
    // Only runs during the 'checkout' phase — once we move to 'confirming' this
    // effect has nothing left to do (Dropin's job is done; the webhook takes over).
    useEffect(() => {
        if (!paymentModal || paymentModal.phase !== 'checkout') return;
        if (!window.Cashfree) {
            showToast('Payment SDK failed to load. Please refresh and try again.', 'error');
            setPaymentModal(null);
            return;
        }
        // Mode must match whatever CASHFREE_ENV the order was actually created under on the
        // backend (threaded through via paymentModal.environment) — never hardcoded here, or
        // the Dropin SDK can silently point at the wrong Cashfree environment.
        const cashfree = window.Cashfree({ mode: paymentModal.environment === 'production' ? 'production' : 'sandbox' });
        cashfree.checkout({
            paymentSessionId: paymentModal.paymentSessionId,
            redirectTarget: '_modal',
        }).then((result) => {
            if (result.error) {
                // A real failure signal from the gateway itself (e.g. card declined) —
                // fine to trust directly, this isn't the "browser claims success" case.
                showToast(result.error.message || 'Payment failed', 'error');
                setPaymentModal(null);
            } else if (result.paymentDetails) {
                // Dropin says the checkout step finished, but this is NOT payment
                // confirmation — only cashfree-webhook writing payment_status='paid'
                // is authoritative. Switch to a pending state and wait for that.
                setPaymentModal(m => m && { ...m, phase: 'confirming' });
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentModal?.orderId, paymentModal?.phase]);

    // While 'confirming': do one immediate check (in case the webhook already
    // landed before we got here), then listen for the real-time UPDATE that
    // cashfree-webhook's DB write produces, with a timeout fallback in case the
    // realtime event is ever missed rather than leaving the user staring at a
    // spinner forever.
    useEffect(() => {
        if (!paymentModal || paymentModal.phase !== 'confirming' || !paymentModal.contractId) return;
        let cancelled = false;
        const contractId = paymentModal.contractId;

        const checkNow = async () => {
            const { data } = await supabase
                .from('gig_contracts')
                .select('payment_status')
                .eq('id', contractId)
                .single();
            if (!cancelled && data?.payment_status === 'paid') {
                handlePaymentConfirmed();
                return true;
            }
            return false;
        };

        checkNow();

        const channel = supabase.channel(`payment-confirm:${contractId}`)
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'gig_contracts', filter: `id=eq.${contractId}`,
            }, (payload) => {
                if (!cancelled && payload.new?.payment_status === 'paid') {
                    handlePaymentConfirmed();
                }
            })
            .subscribe();

        const timeoutId = setTimeout(() => {
            if (!cancelled) setPaymentModal(m => m && { ...m, phase: 'timeout' });
        }, 45000);

        return () => {
            cancelled = true;
            supabase.removeChannel(channel);
            clearTimeout(timeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentModal?.phase, paymentModal?.contractId]);

    // Maximum number of counter-offers allowed in a negotiation chain
    const NEGOTIATE_CAP = 5;

    const handleNegotiateSubmit = async (e) => {
        e.preventDefault();
        if (!gigContext || !user) return;
        const offer = gigContext.activeOffer;
        if (!offer) return;

        // Counter by unchecking items, never by typing a price. The checked-item source is the
        // same displayItems logic used for the offer card: real gig_offer_items rows, or a single
        // synthetic "Service" row (offer.price) for legacy offers that predate line items.
        const rawItems = gigContext.activeOfferItems || [];
        const sourceItems = rawItems.length > 0
            ? rawItems
            : [{ id: 'synthetic', description: 'Service', price: offer.price }];
        const checkedItems = sourceItems.filter(it => negotiateForm.checked?.[it.id]);

        if (checkedItems.length === 0) {
            showToast('Keep at least one line item in the counter-offer.', 'error');
            return;
        }

        const computedPrice = checkedItems.reduce((sum, it) => sum + Number(it.price), 0);

        setSubmittingNegotiate(true);
        let newOfferId = null;
        try {
            // Determine who is negotiating and what direction the counter-offer goes
            const amBuyer = user.id === offer.buyer_id;
            const newDirection = amBuyer ? 'buyer_to_seller' : 'seller_to_buyer';

            // 1. Mark the current offer as 'countered' (not declined — keeps the thread readable)
            const { error: counterErr } = await supabase
                .from('gig_offers')
                .update({ status: 'countered' })
                .eq('id', offer.id);
            if (counterErr) throw counterErr;

            // 2. INSERT the new counter-offer (never update the original), price = sum of checked items
            const { data: newOffer, error: insertErr } = await supabase.from('gig_offers').insert({
                gig_application_id: offer.gig_application_id,
                gig_id: offer.gig_id,
                seller_id: offer.seller_id,
                buyer_id: offer.buyer_id,
                price: computedPrice,
                delivery_days: offer.delivery_days,
                revisions: offer.revisions,
                terms: negotiateForm.terms,
                status: 'pending',
                direction: newDirection,
                parent_offer_id: offer.id
            }).select().single();
            if (insertErr) throw insertErr;
            newOfferId = newOffer.id;

            // 3. Copy only the checked items into their own rows scoped to the new offer
            const { error: itemsError } = await supabase.from('gig_offer_items').insert(
                checkedItems.map((it, idx) => ({
                    gig_offer_id: newOffer.id,
                    description: it.description,
                    price: it.price,
                    sort_order: idx
                }))
            );
            if (itemsError) throw itemsError;

            showToast('Counter-offer sent! ✉️', 'success');
            setShowNegotiateForm(false);
            setNegotiateForm({ checked: {}, terms: '' });
            loadGigContext();
        } catch (err) {
            console.error('Error submitting counter-offer:', err);
            // Don't leave an orphaned counter-offer with no items if the items insert failed.
            if (newOfferId) {
                await supabase.from('gig_offers').delete().eq('id', newOfferId);
            }
            showToast('Failed to send counter-offer.', 'error');
        } finally {
            setSubmittingNegotiate(false);
        }
    };

    const handleSend = async (text, attachment) => {
        if (!activeId || !user) return;
        try {
            const { data, error } = await supabase.from('messages')
                .insert({ 
                    conversation_id: activeId, 
                    sender_id: user.id, 
                    content: text.trim() || (attachment?.name || ''), 
                    file_url: attachment?.url || null 
                })
                .select('*').single();
            if (error) throw error;

            // Optimistic update done via Realtime broadcast primarily, but we can do it here for speed
            setMessagesCache(prev => {
                const existing = prev[activeId] || [];
                if (existing.some(m => m.id === data.id)) return prev;
                return { ...prev, [activeId]: [...existing, data] };
            });

            // Update local conversation preview
            setConversations(prev => {
                return prev.map(c => {
                    if (c.id === activeId) return { ...c, lastMsg: data, updatedAt: new Date(data.created_at).getTime() };
                    return c;
                }).sort((a, b) => b.updatedAt - a.updatedAt);
            });

            // Notify peer with explicit sender name
            const activeConv = conversationsRef.current.find(c => c.id === activeId);
            if (activeConv?.peerId) {
                const senderName = currentUserProfile?.full_name || currentUserProfile?.username || 'Someone';
                const previewText = (text.trim() || attachment?.name || 'an attachment').slice(0, 60);
                
                supabase.rpc('create_notification', {
                    p_user_id: activeConv.peerId,
                    p_type: 'new_message',
                    p_title: `💬 New Message from ${senderName}`,
                    p_body: `${senderName} sent you a message: "${previewText}"`,
                    p_link: `/messages?id=${activeId}`
                }).then(()=>{});
            }
        } catch (err) {
            throw err;
        }
    };

    const handleAcceptRequest = async () => {
        const activeConv = conversations.find(c => c.id === activeId);
        if (!activeConv?.peerId) return;
        try {
            // Look up the pending connection request from this peer
            const { data: pendingReqs, error: fetchErr } = await supabase
                .from('connection_requests')
                .select('id')
                .eq('sender_id', activeConv.peerId)
                .eq('receiver_id', user.id)
                .eq('status', 'pending')
                .limit(1);
            if (fetchErr) throw fetchErr;

            if (!pendingReqs || pendingReqs.length === 0) {
                // No pending request row found — accept optimistically via direct connections insert
                const { error: connErr } = await supabase
                    .from('connections')
                    .insert({ user_one: user.id, user_two: activeConv.peerId });
                if (connErr && connErr.code !== '23505') throw connErr; // ignore duplicate
            } else {
                // Use the RPC to accept (updates connection_requests + inserts into connections)
                const { error: rpcErr } = await supabase
                    .rpc('accept_connection_request', { p_request_id: pendingReqs[0].id });
                if (rpcErr) throw rpcErr;
            }

            showToast('Connection accepted! 🎉', 'success');
            fetchConversations(); // Refresh so the request bar disappears
        } catch (err) {
            console.error('handleAcceptRequest error:', err);
            showToast('Failed to accept: ' + err.message, 'error');
        }
    };

    const handleIgnoreRequest = () => {
        // Optimistic UI hide
        setConversations(prev => prev.filter(c => c.id !== activeId));
        setSearchParams({});
        showToast('Request ignored');
    };

    const handleBlockRequest = async () => {
        // Stub block logic
        showToast('Block functionality coming soon! User temporarily hidden.', 'info');
        setConversations(prev => prev.filter(c => c.id !== activeId));
        setSearchParams({});
    };

    const handleClearChat = async () => {
        if (!activeId) return;
        if (window.confirm('Are you sure you want to clear this chat? This will permanently delete all messages for both of you.')) {
            try {
                const { error } = await supabase.from('messages').delete().eq('conversation_id', activeId);
                if (error) throw error;
                
                // Update local state
                setMessagesCache(prev => ({ ...prev, [activeId]: [] }));
                setConversations(prev => prev.map(c => c.id === activeId ? { ...c, lastMsg: null, updatedAt: Date.now() } : c));
                showToast('Chat cleared successfully', 'success');
            } catch (err) {
                console.error(err);
                showToast('Failed to clear chat: ' + err.message, 'error');
            }
        }
    };

    // Fix Bug 1: Never show blank screen while checking auth.
    if (authLoading) {
        return (
            <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
                <div className="w-full md:w-[320px] lg:w-[380px] shrink-0 border-r border-gray-200">
                    <ConversationListSkeleton />
                </div>
                <div className="hidden md:flex flex-1 flex-col">
                    <ChatWindowSkeleton />
                </div>
            </div>
        );
    }

    const activeConversation = conversations.find(c => c.id === activeId);
    const activeMessages = messagesCache[activeId] || [];

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50 text-gray-900 font-sans relative">
            
            {/* 1. Left Sidebar (Conversation List) */}
            <div className={`w-full md:w-[320px] lg:w-[380px] shrink-0 border-r border-gray-200 bg-white absolute md:relative z-20 md:z-auto h-full transition-transform ${
                activeId ? '-translate-x-full md:translate-x-0' : 'translate-x-0'
            }`}>
                <ConversationList 
                    conversations={conversations}
                    loading={loadingConvs}
                    activeId={activeId}
                    onSelect={(c) => setSearchParams({ id: c.id })}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    roomTab={roomTab}
                    onRoomTabChange={setRoomTab}
                    onlineUsers={onlineUsers}
                />
            </div>

            {/* 2. Center (Chat Window) */}
            <div className={`flex-1 flex flex-col min-w-0 h-full absolute md:relative z-10 md:z-auto w-full transition-transform ${
                !activeId ? 'translate-x-full md:translate-x-0' : 'translate-x-0'
            }`}>
                {activeId && (
                    <button 
                        className="md:hidden absolute top-4 left-4 z-30 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm text-gray-600"
                        onClick={() => setSearchParams({})}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                    </button>
                )}
                
                <div className={`h-full flex flex-col min-h-0 ${activeId ? '[&>div>div:first-child]:pl-14 md:[&>div>div:first-child]:pl-6' : ''}`}>
                    {activeId && gigContext && gigContext.gig && (
                        <div style={{ padding: '0.8rem 1.2rem', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Gig: <span style={{ color: 'var(--peacock-green)' }}>{gigContext.gig.title}</span>
                                </div>
                                {!gigContext.activeOffer && gigContext.isSeller && gigContext.application.status !== 'completed' && (
                                    <button onClick={() => setShowCreateOffer(!showCreateOffer)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.75rem' }}>
                                        {showCreateOffer ? 'Cancel Offer' : 'Create Offer'}
                                    </button>
                                )}
                                {!gigContext.activeOffer && gigContext.isBuyer && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Waiting for applicant to submit an offer.</span>
                                )}
                            </div>

                            {showCreateOffer && gigContext.isSeller && !gigContext.activeOffer && (
                                <form onSubmit={handleCreateOfferSubmit} style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Create Custom Offer</h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Line Items</label>
                                        {offerForm.items.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Description (e.g. Logo design)"
                                                    required
                                                    value={item.description}
                                                    onChange={e => {
                                                        const items = [...offerForm.items];
                                                        items[idx] = { ...items[idx], description: e.target.value };
                                                        setOfferForm({ ...offerForm, items });
                                                    }}
                                                    style={{ flex: 2, minWidth: 0, padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem', background: 'var(--bg-base)' }}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="₹"
                                                    required
                                                    min="1"
                                                    value={item.price}
                                                    onChange={e => {
                                                        const items = [...offerForm.items];
                                                        items[idx] = { ...items[idx], price: e.target.value };
                                                        setOfferForm({ ...offerForm, items });
                                                    }}
                                                    style={{ flex: 1, minWidth: 0, padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem', background: 'var(--bg-base)' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setOfferForm({ ...offerForm, items: offerForm.items.filter((_, i) => i !== idx) })}
                                                    disabled={offerForm.items.length <= 1}
                                                    aria-label="Remove item"
                                                    style={{ padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: offerForm.items.length <= 1 ? 'var(--border-color)' : 'var(--text-muted)', cursor: offerForm.items.length <= 1 ? 'default' : 'pointer', fontSize: '0.8rem' }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setOfferForm({ ...offerForm, items: [...offerForm.items, { description: '', price: '' }] })}
                                            style={{ alignSelf: 'flex-start', padding: '0.35rem 0.7rem', borderRadius: 6, border: '1px dashed var(--border-color)', background: 'transparent', color: 'var(--peacock-green)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                        >
                                            + Add item
                                        </button>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'right', borderTop: '1px dashed var(--border-color)', paddingTop: '0.3rem' }}>
                                            Total: ₹{offerForm.items.reduce((sum, it) => sum + (Number(it.price) || 0), 0).toFixed(2)}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                                        <input type="number" placeholder="Delivery (Days)" required min="1" value={offerForm.delivery_days} onChange={e => setOfferForm({...offerForm, delivery_days: e.target.value})} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem', background: 'var(--bg-base)' }} />
                                        <input type="number" placeholder="Revisions" required min="0" value={offerForm.revisions} onChange={e => setOfferForm({...offerForm, revisions: e.target.value})} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem', background: 'var(--bg-base)' }} />
                                    </div>
                                    <textarea placeholder="Terms of service (optional)" rows="2" value={offerForm.terms} onChange={e => setOfferForm({...offerForm, terms: e.target.value})} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem', background: 'var(--bg-base)', resize: 'none' }}></textarea>
                                    <button type="submit" disabled={submittingOffer} className="btn-primary" style={{ padding: '0.5rem', borderRadius: 6, fontSize: '0.8rem', alignSelf: 'flex-start' }}>
                                        {submittingOffer ? 'Submitting...' : 'Submit Offer'}
                                    </button>
                                </form>
                            )}

                            {gigContext.activeOffer && (() => {
                                const offer = gigContext.activeOffer;
                                const isAccepted = offer.status === 'accepted';

                                // Determine who sees action buttons based on direction.
                                // direction = 'seller_to_buyer': seller sent it → buyer acts.
                                // direction = 'buyer_to_seller': buyer sent it → seller acts.
                                // Null/undefined direction (legacy rows): fall back to isBuyer.
                                const dir = offer.direction || 'seller_to_buyer';
                                const currentUserIsActingParty =
                                    dir === 'seller_to_buyer' ? gigContext.isBuyer : gigContext.isSeller;
                                const currentUserIsWaitingParty = !currentUserIsActingParty;

                                const isPaid = gigContext.contractPaymentStatus === 'paid';

                                // Line items: real gig_offer_items rows if present, otherwise a
                                // single synthetic "Service" row for legacy pre-line-item offers.
                                const rawItems = gigContext.activeOfferItems || [];
                                const displayItems = rawItems.length > 0
                                    ? rawItems
                                    : [{ id: 'synthetic', description: 'Service', price: offer.price }];

                                // Same buyer/seller commission formula as cashfree-create-order's
                                // calculateAmounts() — kept in sync so this preview matches what
                                // Pay Now will actually charge/pay out.
                                const buyerBreakdown = Math.round(offer.price * 1.05 * 100) / 100;
                                const sellerBreakdown = Math.round(offer.price * 0.98 * 100) / 100;

                                // Derive a human-readable label for who sent this offer
                                const offerFromLabel =
                                    isPaid ? '✅ Payment received — work in progress'
                                    : isAccepted ? 'Offer Accepted! Awaiting payment.'
                                    : dir === 'buyer_to_seller' ? '↩ Counter-offer from Buyer'
                                    : offer.parent_offer_id ? '↩ Counter-offer from Seller'
                                    : 'Pending Offer';

                                // Cap check — only show Negotiate if under the limit
                                const canNegotiate =
                                    offer.status === 'pending' &&
                                    currentUserIsActingParty &&
                                    (gigContext.chainDepth || 0) < NEGOTIATE_CAP;

                                return (
                                    <div style={{
                                        background: isAccepted ? 'var(--bg-mint)' : 'var(--bg-surface)',
                                        padding: '0.8rem 1rem',
                                        borderRadius: 8,
                                        border: `1px solid ${isAccepted ? 'var(--border-mint)' : 'var(--border-color)'}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.6rem'
                                    }}>
                                        {/* Offer info row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isAccepted ? 'var(--peacock-green)' : 'var(--text-primary)', marginBottom: '0.2rem' }}>
                                                    {offerFromLabel}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', margin: '0.35rem 0' }}>
                                                    {displayItems.map((item, idx) => (
                                                        <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            <span>{item.description}</span>
                                                            <span>₹{Number(item.price).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.2rem', marginTop: '0.15rem' }}>
                                                        <span>Subtotal</span>
                                                        <span>₹{Number(offer.price).toFixed(2)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                                        <span>Buyer pays (+5% fee)</span>
                                                        <span>₹{buyerBreakdown.toFixed(2)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                                        <span>Seller receives (−2% fee)</span>
                                                        <span>₹{sellerBreakdown.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {offer.delivery_days} Days • {offer.revisions} Revisions
                                                </div>
                                                {offer.terms && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                        Terms: {offer.terms}
                                                    </div>
                                                )}
                                                {(gigContext.chainDepth || 0) >= NEGOTIATE_CAP && offer.status === 'pending' && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                                        Max negotiation rounds reached.
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action buttons — only for the acting party on a pending offer */}
                                            {offer.status === 'pending' && currentUserIsActingParty && (
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <button
                                                        onClick={() => handleOfferAction(offer.id, 'declined')}
                                                        style={{ padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                                                    >
                                                        Decline
                                                    </button>
                                                    {canNegotiate && (
                                                        <button
                                                            onClick={() => {
                                                                setShowNegotiateForm(v => !v);
                                                                // All items ticked by default — countering means unchecking, never retyping a price.
                                                                setNegotiateForm({
                                                                    checked: Object.fromEntries(displayItems.map(it => [it.id, true])),
                                                                    terms: offer.terms || ''
                                                                });
                                                            }}
                                                            style={{ padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--peacock-green)', color: 'var(--peacock-green)', fontWeight: 600, cursor: 'pointer' }}
                                                        >
                                                            {showNegotiateForm ? 'Cancel' : 'Negotiate'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleOfferAction(offer.id, 'accepted')}
                                                        className="btn-primary"
                                                        style={{ padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.75rem' }}
                                                    >
                                                        Accept Offer
                                                    </button>
                                                </div>
                                            )}

                                            {/* Waiting state for the non-acting party */}
                                            {offer.status === 'pending' && currentUserIsWaitingParty && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', alignSelf: 'center' }}>
                                                    {dir === 'buyer_to_seller' ? 'Waiting for seller response...' : 'Waiting for buyer response...'}
                                                </span>
                                            )}

                                            {/* Payment section for accepted, unpaid offers - buyer pays */}
                                            {isAccepted && !isPaid && gigContext.isBuyer && (
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.5rem' }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                        Pay Now: ₹{Number(offer.price * 1.05).toFixed(2)} (includes 5% platform fee)
                                                    </div>
                                                    <button
                                                        onClick={() => handleInitiatePayment(offer.id)}
                                                        disabled={processingPayment}
                                                        className="btn-primary"
                                                        style={{ padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.75rem' }}
                                                    >
                                                        {processingPayment ? 'Processing...' : 'Pay Now'}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Payment status for seller on accepted, unpaid offers */}
                                            {isAccepted && !isPaid && gigContext.isSeller && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    Waiting for buyer to complete payment...
                                                </div>
                                            )}

                                            {/* Delivery deadline — visible to both parties while work is in progress */}
                                            {gigContext.contract?.status === 'in_progress' && gigContext.contract?.buyer_response_deadline && (() => {
                                                const deadline = new Date(gigContext.contract.buyer_response_deadline);
                                                const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
                                                const deadlineLabel = deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                                return (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                        Due by {deadlineLabel} {daysLeft >= 0 ? `(${daysLeft} day${daysLeft === 1 ? '' : 's'} left)` : '(overdue)'}
                                                    </div>
                                                );
                                            })()}

                                            {/* Submit Work — seller, once work is in progress */}
                                            {gigContext.contract?.status === 'in_progress' && gigContext.isSeller && (
                                                <button
                                                    onClick={() => setDeliveryModal({ contractId: gigContext.contract.id })}
                                                    className="btn-primary"
                                                    style={{ padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.75rem', alignSelf: 'flex-start' }}
                                                >
                                                    Submit Work
                                                </button>
                                            )}

                                            {/* Delivery content — buyer's view of what the seller submitted.
                                                Gated on 'submitted' OR 'approved' (not just 'submitted') so the
                                                unlocked original stays reachable here once the buyer approves —
                                                DeliveryFiles itself decides preview-vs-original per contract.status.
                                                No longer gated on delivery_message/delivery_file_url being set:
                                                new deliveries never write delivery_file_url, so that check would
                                                hide every post-fix delivery. Reaching 'submitted' already implies
                                                handleDeliverWork ran at least once. */}
                                            {(gigContext.contract?.status === 'submitted' || gigContext.contract?.status === 'approved') && gigContext.isBuyer && (
                                                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '0.7rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivery Note</div>
                                                    {gigContext.contract.delivery_message && (
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                                                            {gigContext.contract.delivery_message}
                                                        </div>
                                                    )}
                                                    <DeliveryFiles contract={gigContext.contract} />
                                                </div>
                                            )}

                                            {/* Approve — buyer, once work has been submitted */}
                                            {gigContext.contract?.status === 'submitted' && gigContext.isBuyer && (
                                                <button
                                                    onClick={() => handleApproveWork(gigContext.contract.id)}
                                                    className="btn-primary"
                                                    style={{ padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.75rem', alignSelf: 'flex-start' }}
                                                >
                                                    Approve
                                                </button>
                                            )}

                                            {/* Approved confirmation — both parties */}
                                            {gigContext.contract?.status === 'approved' && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--peacock-green)', fontWeight: 700 }}>
                                                    ✅ Work approved — gig complete
                                                </div>
                                            )}
                                        </div>

                                        {/* Negotiate inline form — only shown when acting party clicks Negotiate */}
                                        {showNegotiateForm && canNegotiate && (
                                            <form
                                                onSubmit={handleNegotiateSubmit}
                                                style={{ background: 'var(--bg-base)', padding: '0.85rem', borderRadius: 8, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.25rem' }}
                                            >
                                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Propose Counter-offer</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    Uncheck items to remove them — the price is calculated automatically, never typed.
                                                </div>

                                                {(() => {
                                                    const checkedCount = displayItems.filter(it => negotiateForm.checked?.[it.id]).length;
                                                    const checkedTotal = displayItems.reduce((sum, it) => sum + (negotiateForm.checked?.[it.id] ? Number(it.price) : 0), 0);
                                                    return (
                                                        <>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                                {displayItems.map(item => {
                                                                    const isChecked = !!negotiateForm.checked?.[item.id];
                                                                    return (
                                                                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isChecked}
                                                                                onChange={e => setNegotiateForm(f => ({ ...f, checked: { ...f.checked, [item.id]: e.target.checked } }))}
                                                                                style={{ width: 16, height: 16, accentColor: 'var(--peacock-green)', cursor: 'pointer', flexShrink: 0 }}
                                                                            />
                                                                            <span style={{ flex: 1, color: isChecked ? 'var(--text-primary)' : 'var(--text-muted)', textDecoration: isChecked ? 'none' : 'line-through' }}>
                                                                                {item.description}
                                                                            </span>
                                                                            <span style={{ fontWeight: 700, color: isChecked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                                                                ₹{Number(item.price).toFixed(2)}
                                                                            </span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.35rem' }}>
                                                                <span>New Total ({checkedCount} item{checkedCount === 1 ? '' : 's'})</span>
                                                                <span>₹{checkedTotal.toFixed(2)}</span>
                                                            </div>
                                                            {checkedCount === 0 && (
                                                                <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>
                                                                    Keep at least one item to send a counter-offer.
                                                                </div>
                                                            )}
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                                Delivery & revisions unchanged: {offer.delivery_days}d • {offer.revisions} rev
                                                            </div>
                                                            <textarea
                                                                placeholder="Revised terms (optional)"
                                                                rows="2"
                                                                value={negotiateForm.terms}
                                                                onChange={e => setNegotiateForm(f => ({ ...f, terms: e.target.value }))}
                                                                style={{ padding: '0.45rem 0.6rem', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.8rem', background: 'var(--bg-surface)', resize: 'vertical' }}
                                                            />
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button
                                                                    type="submit"
                                                                    disabled={submittingNegotiate || checkedCount === 0}
                                                                    className="btn-primary"
                                                                    style={{ padding: '0.4rem 0.9rem', borderRadius: 6, fontSize: '0.78rem', alignSelf: 'flex-start', opacity: checkedCount === 0 ? 0.5 : 1 }}
                                                                >
                                                                    {submittingNegotiate ? 'Sending...' : 'Send Counter-offer'}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowNegotiateForm(false)}
                                                                    style={{ padding: '0.4rem 0.9rem', borderRadius: 6, fontSize: '0.78rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </>
                                                    );
                                                })()}

                                                {(gigContext.chainDepth || 0) >= NEGOTIATE_CAP - 1 && (
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                        ⚠️ This is your last negotiation round.
                                                    </div>
                                                )}
                                            </form>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Cashfree Vendor Onboarding Modal */}
                            {vendorModal && (
                                <div style={{
                                    position: 'fixed', inset: 0, zIndex: 9999,
                                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '1rem'
                                }}>
                                    <div style={{
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 16,
                                        padding: '2rem',
                                        width: '100%',
                                        maxWidth: 480,
                                        boxShadow: 'var(--shadow-lg)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1.25rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>&#x1F4B3; Complete Payout Setup</h3>
                                                <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                    To receive payment when this gig is completed, add your bank account or UPI details.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setVendorModal(null)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: 1, padding: '0.2rem', marginLeft: '0.75rem', flexShrink: 0 }}
                                                title="Close"
                                            >&#x2715;</button>
                                        </div>
                                        <PayoutSetupForm
                                            sellerProfileId={vendorModal.sellerId}
                                            onSuccess={() => setVendorModal(null)}
                                            onCancel={() => setVendorModal(null)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Cashfree Payment Modal — 'checkout' while Dropin is open, 'confirming'
                                once Dropin's own promise resolves (NOT payment confirmation — see the
                                effects above), 'timeout' if the webhook hasn't landed after 45s. */}
                            {paymentModal && (
                                <div style={{
                                    position: 'fixed', inset: 0, zIndex: 9999,
                                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '1rem'
                                }}>
                                    <div style={{
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 16,
                                        padding: '2rem',
                                        width: '100%',
                                        maxWidth: 420,
                                        boxShadow: 'var(--shadow-lg)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        textAlign: 'center'
                                    }}>
                                        {paymentModal.phase === 'checkout' && (
                                            <>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Opening secure payment...</h3>

                                                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.75rem 0.9rem' }}>
                                                    {(paymentModal.lineItems || []).map((item, idx) => (
                                                        <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                                            <span>{item.description}</span>
                                                            <span>₹{Number(item.price).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.25rem', marginTop: '0.1rem' }}>
                                                        <span>Subtotal</span>
                                                        <span>₹{Number(paymentModal.amounts?.offer_price).toFixed(2)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        <span>Platform fee (+5%)</span>
                                                        <span>₹{Number(paymentModal.amounts?.platform_fee_buyer).toFixed(2)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.92rem', fontWeight: 800, color: 'var(--peacock-green)', borderTop: '1px solid var(--border-color)', paddingTop: '0.3rem', marginTop: '0.15rem' }}>
                                                        <span>Total</span>
                                                        <span>₹{Number(paymentModal.amounts?.buyer_amount).toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setPaymentModal(null)}
                                                    style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}

                                        {paymentModal.phase === 'confirming' && (
                                            <>
                                                <span style={{ width: 32, height: 32, margin: '0 auto', border: '3px solid var(--border-color)', borderTopColor: 'var(--peacock-green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Confirming payment...</h3>
                                                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                    We're verifying your payment of ₹{paymentModal.amounts?.buyer_amount} with Cashfree. This usually takes a few seconds.
                                                </p>
                                                {/* No "Cancel" here on purpose — the card/UPI step already completed on
                                                    Cashfree's side by this point, so "cancel" would be misleading. Closing
                                                    just stops watching; the contract updates in the background regardless. */}
                                                <button
                                                    onClick={() => setPaymentModal(null)}
                                                    style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    Continue in background
                                                </button>
                                            </>
                                        )}

                                        {paymentModal.phase === 'timeout' && (
                                            <>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Still confirming...</h3>
                                                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                    This is taking longer than usual. If you completed the payment, it will still go through — this will update automatically, or you can check again now.
                                                </p>
                                                <button
                                                    onClick={() => setPaymentModal(m => m && { ...m, phase: 'confirming' })}
                                                    className="btn-primary"
                                                    style={{ padding: '0.6rem 1rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    Check again
                                                </button>
                                                <button
                                                    onClick={() => setPaymentModal(null)}
                                                    style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
                                                >
                                                    Continue in background
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Deliver Work Modal */}
                            {deliveryModal && (
                                <div style={{
                                    position: 'fixed', inset: 0, zIndex: 9999,
                                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '1rem'
                                }}>
                                    <div style={{
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 16,
                                        padding: '2rem',
                                        width: '100%',
                                        maxWidth: 480,
                                        boxShadow: 'var(--shadow-lg)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1.25rem'
                                    }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>📦 Deliver Your Work</h3>
                                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                Describe your delivery and attach the finished work for the buyer to review.
                                            </p>
                                        </div>

                                        <form onSubmit={handleDeliverWork} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Describe your delivery</label>
                                                <textarea
                                                    rows={4}
                                                    value={deliveryMessage}
                                                    onChange={e => setDeliveryMessage(e.target.value)}
                                                    placeholder="Summarize what you're delivering, any notes for the buyer..."
                                                    disabled={submittingDelivery}
                                                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.85rem', background: 'var(--bg-base)', color: 'var(--text-primary)', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                                />
                                            </div>

                                            <div style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-color)', padding: '1.25rem', borderRadius: 12, textAlign: 'center' }}>
                                                <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>📎</div>
                                                <input
                                                    type="file"
                                                    id="delivery-file-upload"
                                                    onChange={e => setDeliveryFile(e.target.files?.[0] || null)}
                                                    disabled={submittingDelivery}
                                                    style={{ display: 'none' }}
                                                />
                                                <label
                                                    htmlFor="delivery-file-upload"
                                                    className="btn-primary"
                                                    style={{ padding: '0.5rem 1rem', borderRadius: 8, cursor: submittingDelivery ? 'not-allowed' : 'pointer', fontSize: '0.85rem', display: 'inline-block' }}
                                                >
                                                    {deliveryFile ? 'Change File' : 'Choose File'}
                                                </label>
                                                {deliveryFile && (
                                                    <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--peacock-green)', fontWeight: 600 }}>✓ {deliveryFile.name}</div>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.1rem' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => { setDeliveryModal(null); setDeliveryMessage(''); setDeliveryFile(null); }}
                                                    disabled={submittingDelivery}
                                                    style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: submittingDelivery ? 'not-allowed' : 'pointer' }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={submittingDelivery}
                                                    className="btn-primary"
                                                    style={{ flex: 2, padding: '0.6rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, opacity: submittingDelivery ? 0.7 : 1, cursor: submittingDelivery ? 'not-allowed' : 'pointer' }}
                                                >
                                                    {submittingDelivery ? 'Delivering...' : 'Deliver'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <ChatWindow 
                        conversation={activeConversation}
                        messages={activeMessages}
                        loadingMsgs={loadingMsgs}
                        user={user}
                        onSend={handleSend}
                        onAcceptRequest={handleAcceptRequest}
                        onIgnoreRequest={handleIgnoreRequest}
                        onBlockRequest={handleBlockRequest}
                        onOpenProfile={() => setShowRightSidebar(true)}
                        onClearChat={handleClearChat}
                        onlineUsers={onlineUsers}
                    />
                </div>
            </div>

            {/* 3. Right Sidebar (Profile Info) */}
            {activeId && (
                <>
                    {showRightSidebar && (
                        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setShowRightSidebar(false)} />
                    )}
                    <div className={`absolute right-0 top-0 h-full w-[85%] sm:w-[320px] bg-white z-50 shadow-2xl lg:shadow-none lg:relative lg:z-auto lg:block transition-transform duration-300 ease-in-out ${showRightSidebar ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                        <RightSidebar 
                            peer={activeConversation?.peer}
                            messages={activeMessages}
                            onClose={() => setShowRightSidebar(false)}
                            onlineUsers={onlineUsers}
                            connectionsData={connectionsData}
                            currentUserId={user.id}
                        />
                    </div>
                </>
            )}

            <Toast {...toast} onHide={hideToast} />
        </div>
    );
}
