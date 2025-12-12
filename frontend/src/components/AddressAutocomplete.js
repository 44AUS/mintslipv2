import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  onAddressSelect,
  placeholder = "Start typing your address...",
  id,
  "data-testid": dataTestId,
  required = false,
  className = ""
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps is loaded
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGoogleMaps()) return;

    // Poll for Google Maps to load
    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "us" },
        fields: ["address_components", "formatted_address"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        
        if (!place.address_components) return;

        // Parse address components
        let streetNumber = "";
        let route = "";
        let city = "";
        let state = "";
        let zip = "";

        place.address_components.forEach((component) => {
          const types = component.types;
          if (types.includes("street_number")) {
            streetNumber = component.long_name;
          }
          if (types.includes("route")) {
            route = component.long_name;
          }
          if (types.includes("locality")) {
            city = component.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            state = component.short_name;
          }
          if (types.includes("postal_code")) {
            zip = component.long_name;
          }
        });

        const streetAddress = `${streetNumber} ${route}`.trim();
        
        // Call the callback with parsed address
        if (onAddressSelect) {
          onAddressSelect({
            address: streetAddress,
            city,
            state,
            zip,
            fullAddress: place.formatted_address
          });
        }
        
        // Update the input value
        if (onChange) {
          onChange({ target: { value: streetAddress, name: id } });
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error("Error initializing Google Places Autocomplete:", error);
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onAddressSelect, onChange, id]);

  return (
    <Input
      ref={inputRef}
      id={id}
      data-testid={dataTestId}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={className}
      autoComplete="off"
    />
  );
}
