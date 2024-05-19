# ideas

## Ideas

### Some ideas and optimisations:

```
H1
-> H2
 -> H3, H4, H5 ... other contents
```

- indexing is a powerful way to combine the content, if we move the section to `#` and start the content from `##` then 
> what we can do is 
event if we create another file with same H1 tag and keep H2 tags as the sub-sections inside the main section, so the hierarchy becomes like the above and the docs will be cleaner.

- bootstrap is loaded unecessarily, we need to migrate all existing template code to mantine so that only single css is being loaded

- checking if we can do "themes" just by using mantine-color-scheme from its css