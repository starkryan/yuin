import React, { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/lib/context/AppContext';

interface CountrySelectorProps {
  onSelect?: (country: string) => void;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ onSelect }) => {
  const { countries, selectedCountry, setSelectedCountry } = useAppContext();
  const [open, setOpen] = useState(false);
  const [countryList, setCountryList] = useState<{ value: string; label: string; flag: string }[]>([]);

  useEffect(() => {
    if (countries) {
      const formattedCountries = Object.entries(countries).map(([key, country]) => {
        // Get the country ISO code
        const iso = Object.keys(country.iso)[0]?.toLowerCase();
        
        return {
          value: key,
          label: country.text_en,
          flag: iso ? `https://flagcdn.com/w20/${iso}.png` : '',
        };
      }).sort((a, b) => a.label.localeCompare(b.label));
      
      setCountryList(formattedCountries);
    }
  }, [countries]);

  const handleSelect = (value: string) => {
    setSelectedCountry(value);
    setOpen(false);
    if (onSelect) {
      onSelect(value);
    }
  };

  const selectedCountryItem = countryList.find(item => item.value === selectedCountry);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCountryItem ? (
            <div className="flex items-center">
              {selectedCountryItem.flag && (
                <img
                  src={selectedCountryItem.flag}
                  alt={selectedCountryItem.label}
                  className="mr-2 h-4 w-auto"
                />
              )}
              {selectedCountryItem.label}
            </div>
          ) : (
            "Select a country"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {countryList.map((country) => (
              <CommandItem
                key={country.value}
                value={country.value}
                onSelect={handleSelect}
                className="flex items-center"
              >
                {country.flag && (
                  <img
                    src={country.flag}
                    alt={country.label}
                    className="mr-2 h-4 w-auto"
                  />
                )}
                <span>{country.label}</span>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    selectedCountry === country.value ? "opacity-100" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CountrySelector; 