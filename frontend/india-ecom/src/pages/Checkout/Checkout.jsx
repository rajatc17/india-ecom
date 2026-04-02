import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart, removeFromCart, updateCartItem, selectCartItemsNewestFirst } from '../../store/cart/cartSlice';
import { getAddressDisplayLines, initialAddressForm } from '../../api/util';
import { api } from '../../api/client';
import CartLineItem from '../../components/cart/CartLineItem';
import AddressFormModal from '../../components/modal/AddressFormModal';
import { updateUserProfile } from '../../store/auth/authSlice';
import { openLoginModal } from '../../store/modal/modalSlice';

const GST_RATE = 0.18;
const MARKETPLACE_FEE_RATE = 0.001;
const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatINR = (value) => INR_FORMATTER.format(Number(value || 0));

const getProductId = (item) => item?.product?._id || item?.product;

const getMaxStock = (item) => item?.availableStock ?? item?.product?.stock ?? item?.productDetails?.stock ?? 99;

const getDefaultAddress = (addresses = []) => {
  if (!Array.isArray(addresses) || addresses.length === 0) {
    return null;
  }

  return addresses.find((addr) => addr?.isDefault) || addresses[0];
};

const getAddressId = (address, index) => String(address?._id || `addr-${index}`);

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems, subtotal, loading, error } = useSelector((state) => state.cart);
  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);
  const items = useSelector(selectCartItemsNewestFirst);
  const isPaymentStep = location.pathname.startsWith('/checkout/payment');
  const allAddresses = useMemo(
    () => (Array.isArray(currentUser?.addresses) ? currentUser.addresses : []),
    [currentUser?.addresses]
  );
  const defaultAddress = getDefaultAddress(allAddresses);
  const [confirmedAddressId, setConfirmedAddressId] = useState('');
  const [pendingAddressId, setPendingAddressId] = useState('');
  const [isAddressPickerOpen, setIsAddressPickerOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cod');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressModalInitialValues, setAddressModalInitialValues] = useState(initialAddressForm);
  const [addressSubmitError, setAddressSubmitError] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const isGuestCheckout = !isAuthenticated;

  useEffect(() => {
    if (!defaultAddress || confirmedAddressId) return;

    const fallbackId = getAddressId(defaultAddress, 0);
    setConfirmedAddressId(fallbackId);
    setPendingAddressId(fallbackId);
  }, [defaultAddress, confirmedAddressId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (allAddresses.length > 0) return;

    const shouldAutoOpen = sessionStorage.getItem('shilpika:autoOpenAddressAfterSignup') === '1';
    if (!shouldAutoOpen) return;

    handleOpenAddAddressModal();
    sessionStorage.removeItem('shilpika:autoOpenAddressAfterSignup');
  }, [isAuthenticated, allAddresses.length]);

  const confirmedAddress = useMemo(() => {
    if (!allAddresses.length) return null;

    if (!confirmedAddressId) {
      return defaultAddress;
    }

    return allAddresses.find((address, index) => getAddressId(address, index) === confirmedAddressId) || defaultAddress;
  }, [allAddresses, confirmedAddressId, defaultAddress]);

  const addressLines = getAddressDisplayLines(confirmedAddress);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleRemove = (item) => {
    const productId = getProductId(item);
    if (!productId) return;
    dispatch(removeFromCart(productId));
  };

  const handleDecrease = (item) => {
    const productId = getProductId(item);
    if (!productId) return;

    const currentQty = item?.quantity || 1;
    const nextQty = Math.max(1, currentQty - 1);
    if (nextQty === currentQty) return;

    dispatch(updateCartItem({ productId, quantity: nextQty }));
  };

  const handleIncrease = (item) => {
    const productId = getProductId(item);
    if (!productId) return;

    const currentQty = item?.quantity || 1;
    const maxStock = getMaxStock(item);
    const nextQty = Math.min(maxStock, currentQty + 1);
    if (nextQty === currentQty) return;

    dispatch(updateCartItem({ productId, quantity: nextQty }));
  };

  const normalizedSubtotal = Number(subtotal || 0);
  const includedIgst = normalizedSubtotal * (GST_RATE / (1 + GST_RATE));
  const marketplaceFee = normalizedSubtotal * MARKETPLACE_FEE_RATE;
  const grandTotal = normalizedSubtotal + marketplaceFee;
  const isSelectingAddress = isAddressPickerOpen;
  const isBillingButtonBlocked = isSelectingAddress || !items || items.length === 0 || (!isGuestCheckout && !confirmedAddress);

  const handleStartAddressChange = () => {
    if (!allAddresses.length) return;
    setPendingAddressId(confirmedAddressId || getAddressId(allAddresses[0], 0));
    setIsAddressPickerOpen(true);
  };

  const ensureSingleDefault = (addresses) => {
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return [];
    }

    const hasDefault = addresses.some((address) => address?.isDefault);
    if (hasDefault) {
      return addresses;
    }

    return addresses.map((address, index) => ({
      ...address,
      isDefault: index === 0,
    }));
  };

  const handleOpenAddAddressModal = () => {
    setAddressModalInitialValues({
      ...initialAddressForm,
      fullName: currentUser?.name || '',
      phone: currentUser?.phone || '',
      isDefault: allAddresses.length === 0,
    });
    setAddressSubmitError('');
    setIsAddressModalOpen(true);
  };

  const handleCloseAddressModal = () => {
    if (isSavingAddress) return;
    setIsAddressModalOpen(false);
  };

  const handleSaveAddress = async (nextAddress) => {
    if (!nextAddress) return;

    try {
      setIsSavingAddress(true);
      setAddressSubmitError('');

      const currentAddresses = allAddresses.map((address) => ({
        ...address,
        _id: address?._id,
      }));

      const updatedAddresses = ensureSingleDefault(
        nextAddress.isDefault
          ? [
            ...currentAddresses.map((address) => ({ ...address, isDefault: false })),
            nextAddress,
          ]
          : [...currentAddresses, nextAddress]
      );

      const updatedUser = await dispatch(updateUserProfile({ addresses: updatedAddresses })).unwrap();
      const latestAddresses = Array.isArray(updatedUser?.addresses) ? updatedUser.addresses : updatedAddresses;
      const selectedAddress = latestAddresses.find((address) => address?.isDefault) || latestAddresses[latestAddresses.length - 1] || null;

      if (selectedAddress) {
        const selectedAddressId = getAddressId(selectedAddress, latestAddresses.length - 1);
        setConfirmedAddressId(selectedAddressId);
        setPendingAddressId(selectedAddressId);
      }

      setIsAddressModalOpen(false);
      setIsAddressPickerOpen(false);
      setAddressSubmitError('');
    } catch (err) {
      setAddressSubmitError(err || 'Failed to save address. Please try again.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleConfirmAddressSelection = () => {
    if (!pendingAddressId) return;
    setConfirmedAddressId(pendingAddressId);
    setIsAddressPickerOpen(false);
  };

  const isPaymentMethodReady = selectedPaymentMethod === 'cod';

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      dispatch(openLoginModal());
      setPaymentError('Please login first, then add your address to place the order.');
      return;
    }

    if (!confirmedAddress || !items?.length || selectedPaymentMethod !== 'cod' || isPlacingOrder) {
      return;
    }

    setPaymentError('');
    setPaymentSuccess('');
    setIsPlacingOrder(true);

    try {
      const orderPayload = {
        items: items.map((item) => ({
          productId: getProductId(item),
          qty: Number(item?.quantity || 1),
        })),
        address: {
          label: confirmedAddress?.label || 'Home',
          fullName: confirmedAddress?.fullName || currentUser?.name || '',
          phone: confirmedAddress?.phone || currentUser?.phone || '',
          line1: confirmedAddress?.line1 || '',
          line2: confirmedAddress?.line2 || '',
          landmark: confirmedAddress?.landmark || '',
          city: confirmedAddress?.city || '',
          state: confirmedAddress?.state || '',
          pincode: confirmedAddress?.pincode || '',
          country: 'India',
        },
        paymentMethod: 'cod',
      };

      const createdOrder = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      const nextOrderNumber = createdOrder?.orderNumber || createdOrder?._id || '';
      setPlacedOrderNumber(nextOrderNumber);
      setPaymentSuccess('Order placed successfully. Redirecting to your account...');

      await api('/api/cart/clear', { method: 'DELETE' });
      await dispatch(fetchCart());

      await new Promise((resolve) => setTimeout(resolve, 1200));
      navigate('/account', {
        state: nextOrderNumber ? { recentOrderNumber: nextOrderNumber } : undefined,
      });
    } catch (err) {
      setPaymentError(err?.error || err?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const paymentOptions = [
    {
      id: 'upi',
      title: 'UPI (Recommended)',
      subtitle: 'Pay instantly using any UPI app',
      disabled: true,
    },
    {
      id: 'card',
      title: 'Credit / Debit Card',
      subtitle: 'Visa, Mastercard, RuPay accepted',
      disabled: true,
    },
    {
      id: 'netbanking',
      title: 'Net Banking',
      subtitle: 'All major Indian banks supported',
      disabled: true,
    },
    {
      id: 'cod',
      title: 'Cash on Delivery',
      subtitle: 'Pay when your order arrives',
      disabled: false,
    },
  ];

  const handleProceedToPayment = () => {
    if (!isAuthenticated) {
      dispatch(openLoginModal());
      return;
    }

    navigate('/checkout/payment');
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Checkout</h1>
          <p className="text-sm text-gray-500 mt-1">{isPaymentStep ? 'Step 2 of 2: Payment' : 'Step 1 of 2: Review'}</p>
        </div>

        {/* <div className="md:justify-self-center">
          <div className="inline-flex items-center rounded-full border border-amber-200 bg-white/90 p-1 shadow-sm">
            <div className="px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-semibold">Review</div>
            <div className="px-3 py-1 text-xs font-semibold text-amber-800">Payment</div>
          </div>
        </div> */}

        <div className="md:justify-self-end">
          <Link to="/cart" className="text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors">
            Back to cart page
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isPaymentStep ? (
      <div className="mt-6 shilpika-bg rounded-xl border border-amber-200/80 p-3 sm:p-4">
        {isGuestCheckout ? (
          <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-white p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-800">Login Required For Checkout</p>
            <h3 className="mt-1 text-base sm:text-lg font-semibold text-indigo-950">Please login first, then add your address</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-indigo-900/80">
              To continue securely, sign in to your account. After login, add your delivery address and proceed to payment.
            </p>
            <button
              type="button"
              onClick={() => dispatch(openLoginModal())}
              className="mt-3 inline-flex rounded-lg bg-indigo-700 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-800 transition"
            >
              Login to Continue
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Address</p>
                {confirmedAddress ? (
                  <div className="mt-1.5 text-xs text-gray-700 leading-5">
                    <p className="font-semibold text-gray-800">
                      Delivering to {confirmedAddress?.label || confirmedAddress?.fullName || 'Selected Address'}
                    </p>
                    {addressLines.map((line) => <p key={line}>{line}</p>)}
                    <p>Phone: {confirmedAddress?.phone || currentUser?.phone || '-'}</p>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-gray-700">
                    No saved address found. Add one to continue checkout.
                  </p>
                )}
              </div>

              {allAddresses.length > 0 ? (
                <button
                  type="button"
                  onClick={handleStartAddressChange}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 bg-white/85 hover:bg-white transition"
                >
                  Change
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenAddAddressModal}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 bg-white/85 hover:bg-white transition"
                >
                  Add Address
                </button>
              )}
            </div>

            {isAddressPickerOpen ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-white/85 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 mb-2">Select delivery address</p>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {allAddresses.map((address, index) => {
                    const optionId = getAddressId(address, index);
                    const optionLines = getAddressDisplayLines(address);

                    return (
                      <label
                        key={optionId}
                        className={`flex gap-2 rounded-md border p-2 cursor-pointer transition ${
                          pendingAddressId === optionId
                            ? 'border-amber-300 bg-amber-50/80'
                            : 'border-gray-200 bg-white hover:border-amber-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="checkout-address"
                          value={optionId}
                          checked={pendingAddressId === optionId}
                          onChange={(event) => setPendingAddressId(event.target.value)}
                          className="mt-0.5 accent-amber-600"
                        />
                        <div className="text-[11px] text-gray-700 leading-4">
                          <p className="font-semibold text-gray-800">{address?.label || address?.fullName || 'Address'}</p>
                          <p>{address?.fullName || currentUser?.name || '-'}</p>
                          {optionLines.map((line) => <p key={`${optionId}-${line}`}>{line}</p>)}
                          <p>Phone: {address?.phone || currentUser?.phone || '-'}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleConfirmAddressSelection}
                    disabled={!pendingAddressId}
                    className="px-3 py-2 rounded-md bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-60 transition"
                  >
                    Deliver to this address
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
      ) : null}

      {isPaymentStep ? (
      <div className="mt-6 grid grid-cols-1 md:grid-cols-10 gap-6 items-start">
        <div className="md:col-span-6">
          <div className="shilpika-bg rounded-2xl border border-amber-200/80 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Payment Options</h2>
              <Link
                to="/checkout"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 bg-white/90 hover:bg-white transition"
              >
                Back to Review
              </Link>
            </div>

            <div className="space-y-3">
              {paymentOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${
                    selectedPaymentMethod === option.id
                      ? 'border-amber-300 bg-amber-50/80'
                      : option.disabled
                        ? 'border-gray-200 bg-gray-50/70'
                        : 'border-gray-200 bg-white/90 hover:border-amber-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={option.id}
                    checked={selectedPaymentMethod === option.id}
                    onChange={(event) => setSelectedPaymentMethod(event.target.value)}
                    disabled={option.disabled}
                    className="mt-1 accent-amber-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{option.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {option.subtitle}
                      {option.disabled ? ' (coming soon)' : ''}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-amber-200/80 bg-white/90 p-3 sm:p-4">
              {selectedPaymentMethod === 'cod' ? (
                <div>
                  <p className="text-sm font-semibold text-gray-900">Cash on Delivery</p>
                  <p className="mt-1 text-xs text-gray-600">Pay when your order arrives. Our delivery partner will collect the amount at doorstep.</p>
                </div>
              ) : null}
            </div>

            {paymentError ? (
              <p className="mt-3 text-xs text-red-600">{paymentError}</p>
            ) : null}

            {paymentSuccess ? (
              <p className="mt-3 text-xs text-emerald-700">
                {paymentSuccess}
                {placedOrderNumber ? ` Order #${placedOrderNumber}` : ''}
              </p>
            ) : null}

            <button
              type="button"
              className="mt-5 w-full px-4 py-3 rounded-md bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
              disabled={(!isGuestCheckout && !confirmedAddress) || !items || items.length === 0 || !isPaymentMethodReady || isPlacingOrder || Boolean(paymentSuccess)}
              onClick={handlePlaceOrder}
            >
              {isGuestCheckout ? 'Login to place order' : isPlacingOrder ? 'Placing order...' : 'Place Order (COD)'}
            </button>
          </div>
        </div>

        <div className="md:col-span-4 space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Delivery Address</p>
            {confirmedAddress ? (
              <div className="mt-1.5 text-xs text-gray-700 leading-5">
                <p className="font-semibold text-gray-800">Delivering to {confirmedAddress?.label || confirmedAddress?.fullName || 'Selected Address'}</p>
                {addressLines.map((line) => <p key={`payment-${line}`}>{line}</p>)}
                <p>Phone: {confirmedAddress?.phone || currentUser?.phone || '-'}</p>
              </div>
            ) : (
              <p className="mt-1 text-xs text-gray-700">
                {isGuestCheckout
                  ? 'Login first, then add your address from checkout review.'
                  : 'No confirmed address. Go back to review to select one.'}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-3 sm:p-4">
            <h3 className="text-sm font-semibold text-gray-900">Billing Details</h3>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Items</span>
                <span className="font-medium text-gray-900">{totalItems || items?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatINR(normalizedSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">IGST Included (18%)</span>
                <span className="font-medium text-gray-900">{formatINR(includedIgst)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Marketplace Fees (0.1%)</span>
                <span className="font-medium text-gray-900">{formatINR(marketplaceFee)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2.5 flex items-center justify-between">
                <span className="text-gray-700 font-semibold">Total Payable</span>
                <span className="text-sm font-semibold text-gray-900">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-3 sm:p-4">
            <h3 className="text-sm font-semibold text-gray-900">Cart Items</h3>
            {!items || items.length === 0 ? (
              <p className="mt-2 text-xs text-gray-500">No items in cart.</p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {items.map((item) => {
                  const unitPrice = Number(item?.discountedPrice || item?.price || 0);
                  const qty = Number(item?.quantity || 1);
                  const lineTotal = Number(item?.subtotal || unitPrice * qty);
                  const imageUrl = (typeof item?.image === 'string' ? item.image : item?.image?.url)
                    || item?.product?.images?.[0]?.url
                    || item?.productDetails?.images?.[0]?.url
                    || null;

                  return (
                    <div key={item?._id || item?.product?._id || item?.product} className="flex gap-2.5 border border-gray-100 rounded-lg p-2.5">
                      <div className="w-12 h-12 rounded-md bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                        {imageUrl ? <img src={imageUrl} alt={item?.name || 'Product'} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 truncate">{item?.name}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{qty} x {formatINR(unitPrice)}</p>
                      </div>
                      <div className="text-[11px] font-semibold text-gray-800 flex-shrink-0">{formatINR(lineTotal)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      ) : (
      <div className="mt-6 grid grid-cols-1 md:grid-cols-10 gap-6 items-start">
        <div className="md:col-span-7">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">
                Cart Items <span className="text-gray-500">({totalItems || items?.length || 0})</span>
              </div>
              {loading && <div className="text-xs text-gray-500">Updating…</div>}
            </div>

            {!items || items.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Your cart is empty.</p>
                <Link
                  to="/"
                  className="inline-block mt-4 px-5 py-2 rounded-md bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Browse products
                </Link>
              </div>
            ) : isSelectingAddress ? (
              <div className="p-8 text-center bg-amber-50/30">
                <p className="text-sm font-medium text-amber-800">Cart review is temporarily collapsed</p>
                <p className="mt-1 text-xs text-gray-600">Confirm delivery address to continue reviewing items.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item) => {
                  const productId = getProductId(item);

                  return (
                    <CartLineItem
                      key={item?._id || productId}
                      item={item}
                      loading={loading}
                      onRemove={handleRemove}
                      onDecrease={handleDecrease}
                      onIncrease={handleIncrease}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4 sm:p-6 md:sticky md:top-6">
            <h2 className="text-base font-semibold text-gray-900">Billing Details</h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Items</span>
                <span className="font-medium text-gray-900">{totalItems || items?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatINR(normalizedSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">IGST Included (18%)</span>
                <span className="font-medium text-gray-900">{formatINR(includedIgst)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Marketplace Fees (0.1%)</span>
                <span className="font-medium text-gray-900">{formatINR(marketplaceFee)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="text-gray-700 font-semibold">Total Payable</span>
                <span className="text-lg font-semibold text-gray-900">{formatINR(grandTotal)}</span>
              </div>
            </div>

            <div className={isSelectingAddress ? 'mt-6 blur-[1.5px] pointer-events-none select-none' : 'mt-6'}>
              <button
                type="button"
                className="w-full px-4 py-3 rounded-md bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
                disabled={isBillingButtonBlocked}
                onClick={handleProceedToPayment}
              >
                {isGuestCheckout
                  ? 'Login first, then add address'
                  : isSelectingAddress
                    ? 'selecting address...'
                    : 'Continue to Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      <AddressFormModal
        isOpen={isAddressModalOpen}
        mode="add"
        initialValues={addressModalInitialValues}
        isSaving={isSavingAddress}
        submitError={addressSubmitError}
        onClose={handleCloseAddressModal}
        onSubmit={handleSaveAddress}
      />
    </section>
  );
};

export default Checkout;
