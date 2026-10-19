import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddressField } from "@/components/fale/fields";

afterEach(() => { vi.unstubAllGlobals(); });

describe("Current location", () => {
  it("fills the address and locality from the current position", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: (success: PositionCallback) => success({ coords: { latitude: 13.08, longitude: 80.27 } } as GeolocationPosition) },
    });
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ display_name: "12 Hospital Road, Chennai", address: { city: "Chennai", state: "Tamil Nadu", postcode: "600001" } }) });
    vi.stubGlobal("fetch", fetchMock);
    const onChange = vi.fn();
    render(<AddressField value={{}} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Use my current location" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ address: "12 Hospital Road, Chennai", city: "Chennai", state: "Tamil Nadu", pincode: "600001" }));
    expect(fetchMock.mock.calls[0]?.[0]).toContain("lat=13.08&lon=80.27");
  });
});